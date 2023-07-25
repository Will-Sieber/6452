import React, { useEffect, useState } from 'react';
import './HomePage.css';
import Web3, { errors } from 'web3';
import { TOKEN_CONTRACT_ADDRESS as CONTRACT_ADDRESS } from '../config';
import jsondata from '../ABI.json';

const ABI = jsondata;

const HomePage = () => {
  const [numTokens, setNumTokens] = useState(0);
  const [userTokens, setUserTokens] = useState(0);
  const [userAddress, setUserAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [contract, setContractInstance] = useState(null);

  useEffect(() => {
    initializeWeb3();
  }, []);

  useEffect(() => {
    if (contract) {
      Promise.all([fetchTotalSupply(contract), fetchUserSupply(contract)])
        .then(() => setIsLoading(false))
        .catch((error) => console.error('Error fetching data:', error));
    }
  }, [contract]);

  const initializeWeb3 = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.enable();
        const contractInstance = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  
        if (accounts.length > 0) {
          const address = accounts[0];
          setUserAddress(address);
        } else {
          console.error('No accounts found.');
        }

        setContractInstance(contractInstance);
        const supply = await fetchTotalSupply(contractInstance);
        setNumTokens(supply);
        console.log(supply);
        const balance = await fetchUserSupply(contractInstance);
        setUserTokens(balance);
        console.log(balance)
      } catch (error) {
        console.error('Error initializing web3:', error);
      };
    } else {
      console.error('Metamask not installed.');
    }
  };

  const fetchTotalSupply = async (contractInstance) => {
    try {
      const supply = await contractInstance.methods.totalSupply().call();
      setNumTokens(supply);
      return supply;
    } catch (error) {
      console.error('Error fetching total supply:', error);
      setNumTokens(0);
    }
  };

  const fetchUserSupply = async (contractInstance) => {
    try {
      const balance = await contractInstance.methods.balanceOf(userAddress).call();
      setUserTokens(balance);
      return balance;
    } catch (error) {
      console.error('Error fetching user balance:', error);
      setUserTokens(0);
    }
    
  };

  const handleUpload = () => {
    console.log('Mint');
  };

  return (
    <div className="container">
      <h1>Welcome to the 6452 Land Title Management System</h1>
      {isLoading ? (
        <p>Loading...</p>
        ) : (
          <>
            <h2>There are <b>{numTokens}</b> Land Tokens currently minted</h2>
            <h2>You own <b>{userTokens}</b> Land Tokens</h2>
          </>
        )}
      <div className="box" onClick={handleUpload}>
        <h1>Upload Documents</h1>
      </div>
    </div>
  );
};

export default HomePage;
