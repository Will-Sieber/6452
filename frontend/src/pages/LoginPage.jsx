import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate instead of useHistory
import Web3 from 'web3';

const LoginPage = () => {
  const [contractAddress, setContractAddress] = useState('');
  const navigate = useNavigate(); // Use useNavigate instead of useHistory

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.enable();
      const web3 = new Web3(window.ethereum);
      web3.eth.getAccounts().then((accounts) => {
        if (accounts.length > 0) {
          const address = accounts[0];
          localStorage.setItem('AccountAddress', address);
          setContractAddress(address);
        } else {
          navigate('/'); // Use navigate to redirect back to the homepage if no account found
        }
      });
    } else {
      navigate('/'); // Use navigate to redirect back to the homepage if Metamask is not installed
    }
  }, [navigate]);

  return (
    <div>
      <h2>Login with Metamask</h2>
      {contractAddress ? (
        <p>Logged in with address: {contractAddress}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default LoginPage;
