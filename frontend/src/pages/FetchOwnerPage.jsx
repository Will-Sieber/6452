// FetchOwnerPage.js
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import jsondata from "../ABI.json"
import {TOKEN_CONTRACT_ADDRESS as CONTRACT_ADDRESS} from '../config'
const ABI = jsondata;
//const CONTRACT_ADDRESS = localStorage.getItem("contractAddress")

const FetchOwnerPage = () => {
  const [contract, setContract] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState('');

  useEffect(() => {
    let isMounted = true;
    let web3;

    const initializeWeb3 = async () => {
      if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.enable();
          const contractInstance = new web3.eth.Contract(ABI, CONTRACT_ADDRESS); // Replace 'ABI' and 'CONTRACT_ADDRESS' with your contract's ABI and address
          setContract(contractInstance);

          // Fetch the owner address
          contractInstance.methods
            .owner()
            .call()
            .then((owner) => {
              if (isMounted) {
                setOwnerAddress(owner);
              }
            })
            .catch((error) => {
              console.error('Error getting owner address:', error);
            });
        } catch (error) {
          console.error('Error initializing web3:', error);
        }
      } else {
        console.error('Metamask not installed.');
      }
    };

    initializeWeb3();

    console.log(ABI)

    return () => {
      isMounted = false;
      // Clean up if needed
    };
  }, []);

  return (
    <div>
      <h2>Owner Address</h2>
      {ownerAddress && <p>Owner Address: {ownerAddress}</p>}
    </div>
  );
};

export default FetchOwnerPage;
