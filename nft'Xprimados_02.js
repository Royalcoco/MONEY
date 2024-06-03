import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import MultiSigNFT from './artifacts/contracts/MultiSigNFT.sol/MultiSigNFT.json';

const socket = io('http://localhost:3001'); // Point de connexion du serveur Socket.IO

const contractAddress = 'YOUR_CONTRACT_ADDRESS';

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenURI, setTokenURI] = useState('');
  const [initialPrice, setInitialPrice] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const prov = new ethers.providers.Web3Provider(window.ethereum);
        const sign = prov.getSigner();
        const cont = new ethers.Contract(contractAddress, MultiSigNFT.abi, sign);

        setProvider(prov);
        setSigner(sign);
        setContract(cont);

        const address = await sign.getAddress();
        setTokenURI(`ipfs://Qm...`); // Set the initial token URI
      }
    };
    init();

    socket.on('notification', (message) => {
      setNotifications((prev) => [...prev, message]);
    });

  }, []);

  const createNFT = async () => {
    if (contract) {
      const tx = await contract.createNFT(tokenURI, ethers.utils.parseUnits(initialPrice, 'ether'));
      await tx.wait();
      alert('NFT created successfully');
    }
  };

  const signSale = async () => {
    if (contract) {
      const tx = await contract.signSale(tokenId);
      await tx.wait();
      alert('Sale signed successfully');
    }
  };

  return (
    <div>
      <h1>Multi-Sig NFT Exchange</h1>
      <div>
        <h2>Create NFT</h2>
        <input type="text" placeholder="Token URI" value={tokenURI} onChange={e => setTokenURI(e.target.value)} />
        <input type="text" placeholder="Initial Price (ETH)" value={initialPrice} onChange={e => setInitialPrice(e.target.value)} />
        <button onClick={createNFT}>Create</button>
      </div>
      <div>
        <h2>Sign Sale</h2>
        <input type="text" placeholder="Token ID" value={tokenId} onChange={e => setTokenId(e.target.value)} />
        <button onClick={signSale}>Sign</button>
      </div>
      <div>
        <h2>Notifications</h2>
        <ul>
          {notifications.map((notification, index) => (
            <li key={index}>{notification}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
