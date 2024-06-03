pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

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
