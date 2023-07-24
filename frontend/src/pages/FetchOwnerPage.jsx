// FetchOwnerPage.js
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import ActionAreaCard from '../components/Card';
import jsondata from "../ABI.json"
import './FetchOwnerPage.css'; // Import the CSS file
import {TOKEN_CONTRACT_ADDRESS as CONTRACT_ADDRESS} from '../config'
const ABI = jsondata;
//const CONTRACT_ADDRESS = localStorage.getItem("contractAddress")

const FetchOwnerPage = () => {
  const [contract, setContract] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState('');
  const [URI, setURI] = useState('')
  const [jsonData, setJsonData] = useState(null);

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

            // Fetch the token URI
            contractInstance.methods
            .tokenURI(1)
            .call()
            .then((URI) => {
                if (isMounted) {
                setURI(URI);

                // Fetch the JSON data from the URI
                fetch(URI)
                    .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                    })
                    .then(data => setJsonData(data))
                    .catch(error => console.error('Error fetching JSON data:', error));
                }
            })
            .catch((error) => {
                console.error('Error getting token URI:', error);
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

  const allJsons = [
    jsonData,
    jsonData,
    jsonData,
    jsonData,
    jsonData,
    jsonData,
  ]

  return (
    <div>
      <h2>Owner Address</h2>
      {ownerAddress && <p>Owner Address: {ownerAddress}</p>}
      {URI && <p>URI: {URI}</p>}
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
