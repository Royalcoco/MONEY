const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Web3 = require('web3');
const { ethers } = require('ethers');
const bodyParser = require('body-parser');
const { verifyIdentity, monitorTransactions } = require('./securityService');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());

const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
const privateKey = 'YOUR_PRIVATE_KEY';
const wallet = new ethers.Wallet(privateKey, provider);
const contractAddress = 'YOUR_CONTRACT_ADDRESS';
const contractABI = require('./MultiSigNFT.json').abi;
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

app.post('/initiate', async (req, res) => {
  const { counterparty, token, amount } = req.body;
  try {
    const verified = await verifyIdentity(counterparty);
    if (!verified) throw new Error('Identity verification failed');

    const tx = await contract.createNFT(token, amount);
    await tx.wait();
    io.emit('notification', `New exchange initiated with ID: ${tx.hash}`);
    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/approve', async (req, res) => {
  const { exchangeId } = req.body;
  try {
    const tx = await contract.signSale(exchangeId);
    await tx.wait();
    io.emit('notification', `Exchange approved with ID: ${exchangeId}`);
    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/freeze', async (req, res) => {
  const { exchangeId } = req.body;
  try {
    const tx = await contract.freezeFunds(exchangeId);
    await tx.wait();
    io.emit('notification', `Funds frozen for exchange ID: ${exchangeId}`);
    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/unfreeze', async (req, res) => {
  const { exchangeId } = req.body;
  try {
    const tx = await contract.unfreezeFunds(exchangeId);
    await tx.wait();
    io.emit('notification', `Funds unfrozen for exchange ID: ${exchangeId}`);
    res.json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

server.listen(3001, () => {
  console.log('Secure Exchange app listening on port 3001');
});
