// import React, { useEffect, useState } from 'react';
// import Web3 from 'web3';
// import jsonData from "../src/ABI.json"

// const CONTRACT_ABI = jsonData; // Insert your contract ABI here
// const CONTRACT_ADDRESS = '0xa18515936a846E647B570A2254E0aD810D4B63f8'; // Insert your contract address here

// function App() {
//   const [web3, setWeb3] = useState(undefined);
//   const [contract, setContract] = useState(undefined);
//   const [accounts, setAccounts] = useState([]);
//   const [newTokenURI, setNewTokenURI] = useState('');
//   const [landTokens, setLandTokens] = useState([]);
//   const [ownerAddress, setOwnerAddress] = useState('');


//   useEffect(() => {
//     const init = async () => {
//       if (window.ethereum) {
//         const web3Instance = new Web3(window.ethereum);
//         const accounts = await web3Instance.eth.getAccounts();
//         setWeb3(web3Instance);
//         setAccounts(accounts);
//         window.ethereum.on('accountsChanged', accounts => setAccounts(accounts));
//       } else if (window.web3) {
//         const web3Instance = new Web3(window.web3.currentProvider);
//         const accounts = await web3Instance.eth.getAccounts();
//         setWeb3(web3Instance);
//         setAccounts(accounts);
//       } else {
//         window.alert('Please install and use Metamask to interact with this webpage.');
//       }
//     };
//     init();
//   }, []);

//   useEffect(() => {
//     if (web3) {
//       const contractInstance = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
//       setContract(contractInstance);
//       fetchLandTokens(); // Fetch existing land tokens when the contract is set
//       // Call the owner function and set the owner address
//       contractInstance.methods.owner().call()
//       .then(owner => {
//         setOwnerAddress(owner);
//       })
//       .catch(error => {
//         console.error('Error getting owner address:', error);
//       });

//     fetchLandTokens(); // Fetch existing land tokens when the contract is set
//   }
// }, [web3]);

//   const fetchLandTokens = async () => {
//     try {
//       if (contract) {
//         const events = await contract.getPastEvents('Transfer', { fromBlock: 0, toBlock: 'latest' });
//         const landTokens = events.map(event => event.returnValues.tokenId);
//         setLandTokens(landTokens);
//       }
//     } catch (error) {
//       console.error('Error fetching land tokens:', error);
//     }
//   };

//   const mintToken = async () => {
//     try {
//       await contract.methods.mintLandToken(accounts[0], newTokenURI).send({ from: accounts[0] });
//       alert('Successfully minted new token');
//       fetchLandTokens(); // Fetch the updated list of land tokens after minting
//     } catch (error) {
//       console.error('Error minting token:', error);
//     }
//   };

//   if (typeof web3 === 'undefined' || typeof contract === 'undefined') {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div>
//       <h1>LandToken Mint</h1>
//       <input
//         type="text"
//         value={newTokenURI}
//         onChange={e => setNewTokenURI(e.target.value)}
//         placeholder="Enter new token URI"
//       />
//       <button onClick={mintToken}>Mint Token</button>

//       <h2>Existing Land Tokens:</h2>
//       {landTokens.length > 0 ? (
//         <ul>
//           {landTokens.map((tokenId) => (
//             <li key={tokenId}>{tokenId}</li>
//           ))}
//         </ul>
//       ) : (
//         <p>No land tokens found.</p>
//       )}
//       <h2>Contract Owner:</h2>
//       <p>{ownerAddress}</p>
//     </div>
//   );
// }

// export default App;


import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NavigationBar from './components/NavBar';
import FetchTokensPage from './pages/FetchTokensPage';
import FetchOwnPage from './pages/FetchOwnPage';
import FileCollectorPage from './pages/FileCollectorPage';

const App = () => {
  return (
    <Router>
      <NavigationBar />
      <Routes>
        <Route exact path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/global" element={<FetchTokensPage />} />
        <Route path="/tokens" element={<FetchOwnPage />} />
        <Route path='/filesupload' element={<FileCollectorPage />} />
      </Routes>
    </Router>
  );
};

export default App;
