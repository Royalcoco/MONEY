import ipfshttpclient

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

# Connect to IPFS
client = ipfshttpclient.connect('/dns/localhost/tcp/5001/http')

# Add the video to IPFS
res = client.add('mirror_heart_animation.mp4')
ipfs_hash = res['Hash']
print(f"IPFS Hash: {ipfs_hash}")
from web3 import Web3
from solcx import compile_source

# Connect to Ethereum node
w3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'))

# Solidity source code
contract_source_code = '''
pragma solidity ^0.8.0;

contract DynamicPriceNFT is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;
    mapping(uint256 => uint256) public tokenPrices;

    event TokenPriceUpdated(uint256 tokenId, uint256 newPrice);

    constructor() ERC721("DynamicPriceNFT", "DPNFT") {
        tokenCounter = 0;
    }

    function createNFT(string memory tokenURI, uint256 initialPrice) public onlyOwner returns (uint256) {
        uint256 newItemId = tokenCounter;
        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        tokenPrices[newItemId] = initialPrice;
        tokenCounter += 1;
        return newItemId;
    }

    function buyNFT(uint256 tokenId) public payable {
        require(_exists(tokenId), "Token does not exist");
        require(msg.value >= tokenPrices[tokenId], "Insufficient payment");

        address owner = ownerOf(tokenId);
        _transfer(owner, msg.sender, tokenId);
        payable(owner).transfer(msg.value);

        tokenPrices[tokenId] = tokenPrices[tokenId] * 2;
        emit TokenPriceUpdated(tokenId, tokenPrices[tokenId]);
    }

    function getTokenPrice(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return tokenPrices[tokenId];
    }
}
'''

# Compile the contract
compiled_sol = compile_source(contract_source_code)
contract_interface = compiled_sol['<stdin>:DynamicPriceNFT']

# Deploy the contract
w3.eth.default_account = w3.eth.accounts[0]
DynamicPriceNFT = w3.eth.contract(abi=contract_interface['abi'], bytecode=contract_interface['bin'])
tx_hash = DynamicPriceNFT.constructor().transact()
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
contract_address = tx_receipt.contractAddress
print(f"Contract deployed at address: {contract_address}")

# Create the NFT
nft_contract = w3.eth.contract(address=contract_address, abi=contract_interface['abi'])
token_uri = f"ipfs://{ipfs_hash}"
initial_price = Web3.toWei(0.1, 'ether')  # Initial price of 0.1 ETH
tx_hash = nft_contract.functions.createNFT(token_uri, initial_price).transact()
w3.eth.wait_for_transaction_receipt(tx_hash)
print(f"NFT created. Transaction hash: {tx_hash.hex()}")
