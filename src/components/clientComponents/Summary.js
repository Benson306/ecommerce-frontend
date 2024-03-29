import { useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { Store } from 'react-notifications-component';
import Personal from "./Personal";
import useCart from "../../context/CartContext";
import { TrinitySpinner } from 'loading-animations-react';

const Summary = () => {

    const { products, total, updateCounty, updatePickup, clearState }  = useCart();

    const history = useHistory();

    
    const [ location, setLocation ] = useState(null); //set pickup point
    const [ county, setCounty ] = useState(null); //set county

    const [ pickup, setPickup ] = useState([]); //list of pickup points
    const [ counties, setCounties ] = useState([]); //list of counties

    const [items, setItems] = useState([]); //list of products from cart

    const [pending, setPending] = useState(false)
    const [loading, setLoading] = useState(false)


    useEffect(()=>{
        const abortCont =  new AbortController();

        setItems(products)

        fetch(`${process.env.REACT_APP_API_URL}/county`,{signal: abortCont.signal})
        .then((res)=>{
            if(res.ok){
                return res.json();
            }else{
                setLoading(false);
            }
        })
        .then(res =>{
            setLoading(false);
            let result = [];
            res.forEach( r =>{
                result.push(r.county)
            })
            let uniqueData = [...new Set(result)];
            setCounties(uniqueData);
            setCounty("Nairobi")
        })
        .catch((err)=>{
            setLoading(false);
        })

       return () => abortCont.abort(); 
    },[])

    function showSpinner(){
        document.querySelector('#spinner').style.visibility='visible';
        document.querySelector('#spinner').style.width='20px';
        document.querySelector('#spinner').style.marginLeft='20px';
    }
    function hideSpinner(){
        document.querySelector('#spinner').style.visibility='hidden';
        document.querySelector('#spinner').style.width='0px';
        document.querySelector('#spinner').style.marginLeft='0px';
    }

    useEffect(()=>{
        setPending(true)
        const abortController = new AbortController();

        fetch(`${process.env.REACT_APP_API_URL}/county/`+county ,{signal: abortController.signal})
        .then((res)=>{
            if(res.ok){
                return res.json();
            }else{
                setPending(false);
            }
        })
        .then(res =>{
            setPending(false);
            let result = [];
            res.forEach( r =>{
                result.push(r.location)
            })
            let uniqData = [...new Set(result)];
            setPickup(uniqData);
        })
        .catch((err)=>{
            setPending(false);
        })

        updateCounty(county);
        
        return () => abortController.abort();  
    },[county])

    useEffect(()=>{
        updatePickup(location);
    },[location]);


    function notify(title, message, type){
        Store.addNotification({
            title: title,
            message: message,
            type: type,
            insert: "top",
            container: "top-right",
            animationIn: ["animate__animated", "animate__fadeIn"],
            animationOut: ["animate__animated", "animate__fadeOut"],
            dismiss: {
            duration: 3000,
            onScreen: true
            }
        }) 
    };


    const handleClick = (e)=>{
        e.preventDefault();

        showSpinner();

        if(location === null || county === null || location === "" || county === ""){
            notify('Failed', 'Select a Delivery Station To Proceed', 'danger')
            return
        }

        fetch(`${process.env.REACT_APP_API_URL}/add_order`,{
            credentials: 'include',
            withCredentials: true,
            proxy: true,
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ products, total, deliveryCounty: county, pickupPoint: location })
        })
        .then((res)=>{
            return res.json();
        })
        .then(res =>{   
            hideSpinner()

            localStorage.removeItem('state');

            clearState();

            history.push({
                pathname: '/payment',
                state: res._id   
            });
            
            notify("Information","Cart has been cleared. Your order Has Been Saved under your Orders on your profile","info");            
        })
      
    }
    
    let deliveryFee = 100;
    let no = 1;
    return ( 
    <div className="summary">
        <div className="panel1">
            <div className="detailsPreview">
                <Personal />
                <br />

                <h2>Delivery</h2>
                <hr />
                <br />
                <form >
                    <div style={{width:'80%', marginLeft:'5%'}}>
                        <h4>Select County:</h4>
                        <br />
                        <select
                        onChange={e =>{setCounty(e.target.value); setLocation(null)} }
                        style={{marginLeft:'5%'}}
                        >
                            { !loading && counties.map( cty => (
                                <option>{cty}</option>
                            ))  }
                        
                        </select>
                        <br /><br />

                        <h4>Select Pickup Point:</h4>
                        <br />
                        <select
                            onChange={e => setLocation(e.target.value)}
                            style={{marginLeft:'5%'}}
                            required
                        >
                            <option value=""></option>
                            { !pending && pickup.map( cty => (
                                <option>{cty}</option>
                            ))  }
                        </select>
                    </div>

                   </form>

                <br />
                <h2>{items.length} Items</h2>
                <br />
                <hr />
                    <table>
                        <th>#</th>
                        <th>Item Name</th>
                        <th>Unit Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                    
                    {
                        items.reverse().map(dt =>(
                            <tr>
                                
                                <td>{ no++ }</td>
                                <td>{dt.prodName}</td>
                                <td>{dt.price}</td>
                                <td>{dt.quantity}</td>
                                <td>{dt.price*dt.quantity}</td>
                                
                            </tr>
                            
                        ))
                    }
                    </table>
                    <div className="subttl">
                       <div className="brand">Delivery Amount:</div>        
                       { deliveryFee }
                    </div>
                    <br />
                    <div className="subTotal">
                       <div className="brand">Total:</div>        
                       {deliveryFee + total }
                    </div>
                    <br />
                    <div className="btns">
                        <div className="recart">
                            <Link to={'/cart'}><button >Make Changes to Order</button></Link>
                        </div>
                        <div className="recart2">
                            <button onClick={(e)=>handleClick(e)} style={{display:'flex',justifyContent:'center'}}>Pay Shs.{total + deliveryFee}<div id="spinner" style={{width:'0px',justifyContent:'center', marginLeft:'0px', visibility:'hidden'}}><TrinitySpinner text="" color="white" /></div></button>
                        </div>
                            
                    </div>
                    
                   <br />


            </div>

        </div>
        
    </div>
     );
}
 
export default Summary;