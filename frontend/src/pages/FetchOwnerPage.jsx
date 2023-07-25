// FetchOwnerPage.js
import React, { useEffect, useState } from 'react';
import Web3, { errors } from 'web3';
import ActionAreaCard from '../components/Card';
import jsondata from "../ABI.json"
import './FetchTokensPage.css'; // Import the CSS file
import {TOKEN_CONTRACT_ADDRESS as CONTRACT_ADDRESS} from '../config';
const ABI = jsondata;
//const CONTRACT_ADDRESS = localStorage.getItem("contractAddress")

const FetchOwnerPage = () => {
  const [contract, setContract] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState('');
  const [URI, setURI] = useState('')
  let index = 0;
  let user_token_ids = [];
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

        try {
          await window.ethereum.enable();
          const contractInstance = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
          setContract(contractInstance);
          
          console.log("bruh")
          findTokenRecursive(contractInstance);
  

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
      console.log("no contract??");
      return;
    }

    contract.methods.tokenOfOwnerByIndex(account, index).call((error, result) => {
      if (!error) {
        console.log(result.toNumber());
        user_token_ids.push(result.toNumber());
        index++;
        findTokenRecursive(contract);
      } else {
        console.log("oopsie wwoopsie")
        return;
      }
    })
  };


  const fetchAccount = async (web3) => {
    const accounts = await web3.eth.getAccounts();
      if (accounts > 0) {
        const userAddress = accounts[0];
        return userAddress;
      }
  }

  const allJsons = [];

  return (
    <div>
      <h2>Owner Address</h2>
      {ownerAddress && <p>Owner Address: {ownerAddress}</p>}
      <div className='cardcontainer'>
        {allJsons.map((item) => (
          <ActionAreaCard
            animationurl = {URI.replace(/\.[^/.]+$/, ".html")}
            name = {item?.name}
            description = {item?.description}
          />
        ))}
      </div>
    </div>
  );
};

export default FetchOwnerPage;
