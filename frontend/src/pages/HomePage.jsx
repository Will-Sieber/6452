// HomePage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // Import the CSS file
import { BACKEND_URL as BASE_URL } from '../config';

const HomePage = () => {
  const [contractAddress, setContractAddress] = useState('');

  const handleContractAddressChange = (event) => {
    setContractAddress(event.target.value);
  };

  const handleContractAddressSubmit = () => {
    // Store the contract address in local storage
    localStorage.setItem('contractAddress', contractAddress);
  };

  const fetchAllTokens = async () => {
    return fetch(BASE_URL+'/all')
    .then((res) => {
      if (!res.ok) {
        throw new Error("Oooer am not good with computer plz help");
      }
      return res.json();
    })
    .then((data) => {
      return data;
    })
    .catch((error) =>  {
      console.error("bad thing uh oh", error);
    });
  };

  // fetchAllTokens().then((allTokens) => {
  //  console.log(allTokens);
  //});

  return (
    <div className="container">
      <h1>Welcome to the 6452 Land Title Management System</h1>
      <div className="form-group">
        <label htmlFor="contractAddress">Enter Contract Address:</label>
        <input
          type="text"
          id="contractAddress"
          value={contractAddress}
          onChange={handleContractAddressChange}
        />
        <button onClick={handleContractAddressSubmit}>Submit</button>
      </div>
    </div>
  );
};

export default HomePage;
