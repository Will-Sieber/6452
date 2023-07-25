// NavigationBar.js
import { React, useEffect, useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NavBar.css'; // Import the CSS file

const NavigationBar = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      setLoggedIn(true)
    } else {
      setLoggedIn(false)
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Clear the contract address from local storage on logout
      localStorage.removeItem('AccountAddress');

      // Request disconnection from the current Ethereum account in Metamask
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({
          method: 'eth_requestAccounts',
          params: [
            {
              eth_accounts: {},
            },
          ],
        });

        // Redirect to the home page after logout
        navigate('/');
      } else {
        console.error('Metamask not installed.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <nav className="navbar">
      <ul className="nav-list">
        <li>
          <Link to="/" className="nav-link">
            Home
          </Link>
        </li>
        <li>
          <Link to="/global" className="nav-link"> {/* Add the new link */}
            All Tokens
          </Link>
        </li>
        <li>
          <Link to="/tokens" className="nav-link">
            My Tokens
          </Link>
        </li>
        {!loggedIn && <li>
          <Link to="/login" className="nav-link">
            Log In
          </Link>
        </li>}
      </ul>
    </nav>
  );
};

export default NavigationBar;
