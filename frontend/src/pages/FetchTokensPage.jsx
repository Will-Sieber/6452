import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import ActionAreaCard from '../components/Card';
import jsondata from "../ABI.json"
import './FetchTokensPage.css'; // Import the CSS file
import {TOKEN_CONTRACT_ADDRESS as CONTRACT_ADDRESS} from '../config'
const ABI = jsondata;

const FetchTokensPage = () => {
  const [contract, setContract] = useState(null);
  const [allJsons, setAllJsons] = useState([]);

  useEffect(() => {
    let isMounted = true;
    let web3;
  
    const initializeWeb3 = async () => {
      if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.enable();
          const contractInstance = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
          setContract(contractInstance);
          // Initialize an empty array to hold JSON data
          const tokenData = [];
          // Loop over a range of token IDs
          for (let i = 1; i <= 10000; i++) {
            try {
              // Fetch the token URI
              const URI = await contractInstance.methods.tokenURI(i).call();
              // Fetch the JSON data from the URI
              const response = await fetch(URI);
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              const data = await response.json();
              // Add the URI and JSON data to the array
              tokenData.push({URI, data});
            } catch (error) {
              console.error(`Error getting token URI for token ${i}:`, error);
              break;
            }
          }
          if (isMounted) {
            // Update the state with the fetched token data
            setAllJsons(tokenData);
          }
  
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

  return (
    <div>
      <h2>Land Tokens: </h2>
      <div className='cardcontainer'>
        {allJsons.map((item, index) => (
          <ActionAreaCard
            key={index}
            animationurl = {item.URI ? item.URI.replace(/\.[^/.]+$/, ".html") : ""}
            name = {item.data?.name}
            description = {item.data?.description}
          />
        ))}
      </div>
    </div>
  );
   
};

export default FetchTokensPage;
