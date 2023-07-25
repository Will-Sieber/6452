// FetchOwnerPage.js
import React, { useEffect, useState } from 'react';
import Web3, { errors } from 'web3';
import MyCard from '../components/My_card';
import jsondata from "../ABI.json";
import helperJsonData from "../HelperABI.json";
import './FetchTokensPage.css'; // Import the CSS file
import {TOKEN_CONTRACT_ADDRESS as CONTRACT_ADDRESS, BACKEND_URL, HELPER_CONTRACT_ADDRESS} from '../config';
import Button from '@mui/material/Button';
const ABI = jsondata;
const HelperABI = helperJsonData;
//const CONTRACT_ADDRESS = localStorage.getItem("contractAddress")

const FetchOwnPage = () => {
  const [URI, setURI] = useState('')
  const [contract, setContract] = useState(null);
  const [address, setAddress] = useState(null);
  const [allJsons, setAllJsons] = useState([]);
  const [tokenIds, setTokenIds] = useState([]);
  const [checked, setChecked] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  let index = 0;
  let account = null;

  useEffect(() => {
    let isMounted = true;
    //let web3;

    const initializeWeb3 = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const web3 = new Web3(window.ethereum);
        //fetchAccount(web3).then((address) => {
        //  account = address;
        //  setAddress(address);
        //})
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        console.log(account);
        setAddress(account)
        const tokenData = [];
        try {
          await window.ethereum.enable();
          const contractInstance = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
          setContract(contractInstance);
          
          const tryThisResult = await findTokenRecursive(contractInstance);
          setTokenIds(tryThisResult);
          tryThisResult.forEach(async token => {
            const URI = await contractInstance.methods.tokenURI(token).call();
            setURI(URI);
            const response = await fetch(URI);
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            const data = await response.json();
            tokenData.push({URI, data, tokenId: token});
            setAllJsons([...tokenData]);
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
  }, [refreshTrigger]);

  const findTokenRecursive = async (contract) => {
    if (!contract) {
      console.error("No valid contract")
      return [];
    }
    const useThisAddress =  address !== null ? address : localStorage.getItem("AccountAddress");
    const thing = await contract.methods.tokenOfOwnerByIndex(address, index).call().then(async (result, error) => {
      if (!error) {
        index++;
        const next_result = await findTokenRecursive(contract);
        next_result.push(result);
        return next_result;
      } else {
        //console.error("oopsie wwoopsie", error)
        return [];
      }
    })
    .catch((error) => {
      //console.error("oh no", error);
      return [];
    });
    return thing;
  };


  const fetchAccount = async (web3) => {
    const accounts = await web3.eth.getAccounts();
      if (accounts > 0) {
        const userAddress = accounts[0];
        return userAddress;
      }
  }

  async function handleMerge() {
    if (checked.length < 2) {
      alert("Please select at least 2 tokens to merge")
      //return;
    }
    // Okay
    // To merge, we need to:
    // 1. Contact the backend and check that all tokens are next to each other
    // 2. Allow the Helper contract to access the selected tokens
    // 3. Call the merge function on the Helper contract
    // 4. Make sure merge is reflected on the backend
    const reference_ids = [];
    allJsons.map((item) => {
      if (checked.includes(item.tokenId)) {
        reference_ids.push(item.data.reference_id);
      }
    })

    // 1.
    const success = await fetch(BACKEND_URL + "/check/merge", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({reference_ids})
    }).then((response) => response.json())
    .then((data) => {
      if (!data.valid) {
        alert(`The tokens with the following reference_ids are not next to each other: ${data.not_touching}`)
        return false;
      }
      return true;
    }).catch((error) => console.error(error))

    if (success) {
      // Okay, they are next to each other.
      // Lets go ahead with step two.
      console.log(address);
      try {
        const result = await contract.methods.setApprovalForAll(HELPER_CONTRACT_ADDRESS, true).send({from: address})
        console.log(result);
      } catch (error) {
        if (error.name == "TypeError") {
          alert('Please allow us access to your LandTokens so we can merge them.')
        }
        console.error(error);
        return;
      }

      // Step 3:
      const web3 = new Web3(window.ethereum);
      const helperContractInstance = new web3.eth.Contract(HelperABI, HELPER_CONTRACT_ADDRESS);
      const mergeResult = await helperContractInstance.methods.mergeTokens(checked).send({from: address});

      console.log(mergeResult)

      // Step 4:
      const mergeSuccess = await fetch(BACKEND_URL+ "/merge", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({reference_ids})
      }).then((response) => response.json())
      .then((data) => {
        if (data.success === false) {
          alert(`The merge failed.`)
          console.error(data.message)
          return false;
        }
        return data.success;
      }).catch((error) => console.error(error))
      console.log(`Merge success: ${mergeSuccess}`)
      
      // Force refresh of tokens
      setRefreshTrigger(refreshTrigger + 1);
    }
  }

  return (
    <div>
      <div className='cardcontainer'>
        {allJsons.map((item, index) => (
          <MyCard
          key={item.data?.name}
          boundary = {item.data?.boundary}
          holes = {item.data?.holes}
          animationurl = {item.data?.animation_url.replace(/\.[^/.]+$/, ".html")}
          name = {item.data?.name}
          description = {item.data?.description}
          isCheckedCallback={() => {
            if (checked.includes(item.tokenId)) {
              setChecked(checked.filter((token) => token !== item.tokenId));
            } else {
              setChecked([...checked, item.tokenId]);
            }
          }}
        />
        ))}
      </div>
      <div style={{margin: "20px"}}>
        <Button variant="contained" color="primary" onClick={handleMerge}>
          Merge
        </Button>
      </div>
    </div>
  );
};

export default FetchOwnPage;
