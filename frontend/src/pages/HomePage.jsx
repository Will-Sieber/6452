// HomePage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // Import the CSS file

const HomePage = () => {
  const [contractAddress, setContractAddress] = useState('');

  const handleContractAddressChange = (event) => {
    setContractAddress(event.target.value);
  };

  const handleContractAddressSubmit = () => {
    // Store the contract address in local storage
    localStorage.setItem('contractAddress', contractAddress);
  };

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
