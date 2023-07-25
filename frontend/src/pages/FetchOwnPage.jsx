// FetchOwnerPage.js
import React, { useEffect, useState } from 'react';
import Web3, { errors } from 'web3';
import MyCard from '../components/My_card';
import jsondata from "../ABI.json"
import './FetchTokensPage.css'; // Import the CSS file
import {TOKEN_CONTRACT_ADDRESS as CONTRACT_ADDRESS} from '../config';
import Button from '@mui/material/Button';
const ABI = jsondata;
//const CONTRACT_ADDRESS = localStorage.getItem("contractAddress")

const FetchOwnPage = () => {
  const [URI, setURI] = useState('')
  const [allJsons, setAllJsons] = useState([]);
  let index = 0;
  let account = null;

  useEffect(() => {
    let isMounted = true;
    let web3;

    const initializeWeb3 = async () => {
      if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        fetchAccount(web3).then((address) => {
          account = address;
        })
        const tokenData = [];
        try {
          await window.ethereum.enable();
          const contractInstance = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
          
          const tryThisResult = await findTokenRecursive(contractInstance);
          tryThisResult.forEach(async token => {
            const URI = await contractInstance.methods.tokenURI(token).call();
            setURI(URI);
            const response = await fetch(URI);
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            const data = await response.json();
            tokenData.push({URI, data});
            setAllJsons([...tokenData]);
          });
        } catch (error) {
          console.error('Error initializing web3:', error);
        }
      } else {
        console.error('Metamask not installed.');
      }
    };

    initializeWeb3();

    return () => {
      isMounted = false;
      // Clean up if needed
    };
  }, []);

  const findTokenRecursive = async (contract) => {
    if (!contract) {
      console.error("No valid contract")
      return [];
    }
    const thing = await contract.methods.tokenOfOwnerByIndex(account, index).call().then(async (result, error) => {
      if (!error) {
        index++;
        const next_result = await findTokenRecursive(contract);
        next_result.push(result);
        return next_result;
      } else {
        //console.error("oopsie wwoopsie", error)
        return [];
      }
    })
    .catch((error) => {
      //console.error("oh no", error);
      return [];
    });
    return thing;
  };


  const fetchAccount = async (web3) => {
    const accounts = await web3.eth.getAccounts();
      if (accounts > 0) {
        const userAddress = accounts[0];
        return userAddress;
      }
  }
  
  return (
    <div>
      <div className='cardcontainer'>
        {allJsons.map((item, index) => (
          <MyCard
          key={item.data?.name}
          animationurl = {URI.replace(/\.[^/.]+$/, ".html")}
          name = {item.data?.name}
          description = {item.data?.description}
        />
        ))}
      </div>
      <div style={{margin: "20px"}}>
        <Button variant="contained" color="primary" onClick={console.log("button")}>
          Merge
        </Button>
      </div>
    </div>
  );
};

export default FetchOwnPage;
