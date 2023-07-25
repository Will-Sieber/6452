// HomePage.js
import React, { useState } from 'react';
import './HomePage.css'; // Import the CSS file
import { BACKEND_URL as BASE_URL } from '../config';

const HomePage = () => {
  const [numTokens, setnumTokens] = useState(0);

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

  fetchAllTokens().then( async (allTokens) => {
    const response = await allTokens;
    setnumTokens(response.tokens.length);
  });

  const handleMerge = () => {
    console.log("Merge")
  }

  const handleSplit = () => {
    console.log("Split")
  }

  const handleMint = () => {
    console.log("Mint")
  }

  return (
    <div className="container">
      <h1>Welcome to the 6452 Land Title Management System</h1>
      <h2>There are <b>{numTokens}</b> Land Tokens currently minted</h2>
      <div className="box" onClick={handleMerge}>
        <h1>Merge</h1>
      </div>
      <div className="box" onClick={handleSplit}>
        <div className="content">
          <h1>Split</h1>
        </div>
      </div>
      <div className="box" onClick={handleMint}>
        <h1>Free tokens</h1>
      </div>
    </div>
  );
};

export default HomePage;
