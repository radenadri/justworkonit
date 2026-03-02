# Project 3: DeFi Vault - Tasks

## Task 3.1: Smart Contracts

### Step 1: Setup Project

```bash
mkdir -p projects/web3-defi-vault
cd projects/web3-defi-vault
forge init .
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### Step 2: Create MockERC20.sol

**Files:**
- Create: `projects/web3-defi-vault/src/MockToken.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 __decimals
    ) ERC20(_name, _symbol) {
        _decimals = __decimals;
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
```

### Step 3: Create SimpleVault.sol

**Files:**
- Create: `projects/web3-defi-vault/src/SimpleVault.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Metadata is IERC20 {
    function decimals() external view returns (uint8);
}

contract SimpleVault {
    IERC20 public immutable asset;
    uint8 public immutable assetDecimals;
    
    mapping(address => uint256) public userBalance;
    uint256 public totalAssets;
    uint256 public constant REWARD_RATE = 500; // 5% APY
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 reward);
    
    constructor(address _asset) {
        require(_asset != address(0), "Invalid asset address");
        asset = IERC20(_asset);
        assetDecimals = IERC20Metadata(_asset).decimals();
    }
    
    function deposit(uint256 _amount) external {
        require(_amount > 0, "Cannot deposit 0");
        
        require(
            asset.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        userBalance[msg.sender] += _amount;
        totalAssets += _amount;
        
        emit Deposited(msg.sender, _amount);
    }
    
    function withdraw(uint256 _amount) external {
        require(_amount > 0, "Cannot withdraw 0");
        require(userBalance[msg.sender] >= _amount, "Insufficient balance");
        
        uint256 reward = calculateReward(msg.sender, _amount);
        
        userBalance[msg.sender] -= _amount;
        totalAssets -= _amount;
        
        require(
            asset.transfer(msg.sender, _amount + reward),
            "Transfer failed"
        );
        
        emit Withdrawn(msg.sender, _amount, reward);
    }
    
    function calculateReward(address _user, uint256 _amount) public view returns (uint256) {
        return (_amount * REWARD_RATE) / 10000;
    }
    
    function getUserBalance(address _user) external view returns (uint256) {
        return userBalance[_user] + calculateReward(_user, userBalance[_user]);
    }
}
```

### Step 4: Write & Run Tests

```bash
cd projects/web3-defi-vault
forge test
```

---

## Task 3.2: Frontend

### Step 1: Setup Next.js

```bash
cd projects/web3-defi-vault
npx create-next-app@latest frontend --typescript --tailwind --eslint --app
cd frontend
npm install wagmi viem @tanstack/react-query
```

### Step 2: Create Hooks

**Files:**
- Create: `frontend/hooks/useApproveToken.ts`
- Create: `frontend/hooks/useDeposit.ts`
- Create: `frontend/hooks/useWithdraw.ts`

### Step 3: Create Components

**Files:**
- Create: `frontend/components/VaultDashboard.tsx`
- Create: `frontend/components/DepositForm.tsx`
- Create: `frontend/components/WithdrawForm.tsx`
- Create: `frontend/lib/format.ts` - BigInt formatting

### Step 4: Test

```bash
cd frontend
npm run dev
```

---

## Verification

| Step | Command | Expected |
|------|---------|----------|
| Contract Tests | `forge test` | All pass |
| Approve UI | Click approve | Transaction 1 |
| Deposit UI | Click deposit | Transaction 2 |
| TVL Display | View dashboard | Shows total assets |
| BigInt Format | View amounts | Formatted (e.g., 1.5 USDC) |
