# Project 4: DAO Voting - Tasks

## Task 4.1: Smart Contracts

### Step 1: Setup Project

```bash
mkdir -p projects/web3-dao-voting
cd projects/web3-dao-voting
forge init .
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### Step 2: Create GovernanceToken.sol

**Files:**
- Create: `projects/web3-dao-voting/src/GovernanceToken.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes {
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** decimals();
    
    constructor() ERC20("GovernanceToken", "GOV") ERC20Permit("GovernanceToken") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
    
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }
    
    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
```

### Step 3: Create DAOGovernor.sol

**Files:**
- Create: `projects/web3-dao-voting/src/DAOGovernor.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DAOGovernor is Governor {
    ERC20 public immutable token;
    
    uint256 public votingDelay = 1 days;
    uint256 public votingPeriod = 7 days;
    uint256 public proposalThreshold = 1 * 10 ** 18;
    uint256 public quorum = 4;
    
    constructor(ERC20 _token) {
        token = _token;
    }
    
    function votingDelay() public view override returns (uint256) {
        return votingDelay;
    }
    
    function votingPeriod() public view override returns (uint256) {
        return votingPeriod;
    }
    
    function proposalThreshold() public view override returns (uint256) {
        return proposalThreshold;
    }
    
    function quorum(
        uint256 blockNumber
    ) public view override returns (uint256) {
        return (token.getPastTotalSupply(blockNumber) * quorum) / 100;
    }
}
```

### Step 4: Write & Run Tests

```bash
cd projects/web3-dao-voting
forge test
```

---

## Task 4.2: Frontend

### Step 1: Setup Next.js

```bash
cd projects/web3-dao-voting
npx create-next-app@latest frontend --typescript --tailwind --eslint --app
cd frontend
npm install wagmi viem @tanstack/react-query
```

### Step 2: Create Hooks

**Files:**
- Create: `frontend/hooks/useCreateProposal.ts`
- Create: `frontend/hooks/useCastVote.ts`
- Create: `frontend/hooks/useProposalState.ts`
- Create: `frontend/hooks/useProposalVotes.ts`
- Create: `frontend/types/governance.ts` - ProposalState enum

### Step 3: Create Components

**Files:**
- Create: `frontend/components/ProposalList.tsx`
- Create: `frontend/components/ProposalCard.tsx`
- Create: `frontend/components/CreateProposalForm.tsx`
- Create: `frontend/components/VoteButtons.tsx`

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
| Create Proposal | Submit form | Proposal created |
| Cast Vote | Click vote button | Vote recorded |
| State Tracking | View proposal | Shows Active/Succeeded/etc |
| Progress Bar | View votes | Shows percentage |
| Execute | After success | Proposal executed |

---

## Complete Workflow Test

1. Deploy contracts ke Anvil
2. Mint tokens ke beberapa addresses
3. Delegate votes dari setiap address
4. Buat proposal (butuh threshold votes)
5. Vote dari beberapa addresses
6. Tunggu voting period selesai
7. Execute proposal

---

## Tips for DAO Voting

- Voting delay: Minimal 1 hari agar voters punya waktu
- Voting period: 7 hari standar
- Quorum: 4% minimal untuk mencegah spam
- Proposal threshold: Butuh cukup votes untuk buat proposal
- Test di Anvil dulu sebelum testnet
