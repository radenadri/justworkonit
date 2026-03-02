# Project 2: NFT Gallery - Tasks

## Task 2.1: Smart Contract

### Step 1: Setup Project

```bash
mkdir -p projects/web3-nft-gallery
cd projects/web3-nft-gallery
forge init .
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### Step 2: Create NFTGallery.sol

**Files:**
- Create: `projects/web3-nft-gallery/src/NFTGallery.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NFTGallery is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public mintPrice = 0.01 ether;
    
    mapping(address => bool) public whitelistedMinters;
    
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    
    constructor() ERC721("NFTGallery", "NFTG") Ownable(msg.sender) {}
    
    function mint(string calldata _tokenURI) external payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(nextTokenId < MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        emit NFTMinted(msg.sender, tokenId, _tokenURI);
        nextTokenId++;
    }
    
    function whitelistMint(string calldata _tokenURI) external {
        require(whitelistedMinters[msg.sender], "Not whitelisted");
        require(nextTokenId < MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        emit NFTMinted(msg.sender, tokenId, _tokenURI);
        nextTokenId++;
    }
    
    function addToWhitelist(address[] calldata _accounts) external onlyOwner {
        for (uint256 i = 0; i < _accounts.length; i++) {
            whitelistedMinters[_accounts[i]] = true;
        }
    }
}
```

### Step 3: Write Tests

```bash
cd projects/web3-nft-gallery
forge test
```

---

## Task 2.2: IPFS Setup

### Step 1: Setup Pinata

1. Daftar di https://pinata.cloud
2. Buat API key
3. Simpan ke `.env`

```bash
# .env
PINATA_API_KEY=your_api_key
PINATA_SECRET_KEY=your_secret_key
```

### Step 2: Create Upload Function

**Files:**
- Create: `projects/web3-nft-gallery/frontend/lib/ipfs.ts`

```typescript
import axios from 'axios'

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY

export async function uploadToIPFS(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  
  const res = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    }
  )
  
  return `ipfs://${res.data.IpfsHash}`
}

export async function uploadMetadata(metadata: object): Promise<string> {
  const res = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    metadata,
    {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    }
  )
  
  return `ipfs://${res.data.IpfsHash}`
}
```

---

## Task 2.3: Frontend

### Step 1: Setup Next.js + RainbowKit

```bash
cd projects/web3-nft-gallery
npx create-next-app@latest frontend --typescript --tailwind --eslint --app
cd frontend
npm install @rainbow-me/rainbowkit wagmi viem @tanstack/react-query axios
```

### Step 2: Components

**Files:**
- Create: `frontend/components/GalleryPage.tsx` - Main page with gating
- Create: `frontend/components/NFTCard.tsx` - Display NFT
- Create: `frontend/components/MintForm.tsx` - Mint UI
- Create: `frontend/hooks/useNFTOwnership.ts` - Check balance
- Create: `frontend/hooks/useMintNFT.ts` - Mint function

### Step 3: Test

```bash
cd frontend
npm run dev
```

---

## Verification

| Step | Command | Expected |
|------|---------|----------|
| Contract Tests | `forge test` | All pass |
| IPFS Upload | Test upload function | Returns IPFS URI |
| Frontend | `npm run dev` | No errors |
| Gating Logic | Check balance == 0 | Shows locked content |
