# Web3 Projects Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Membangun 4 project Web3 pembelajaran dari Beginner hingga Expert secara bertahap

**Architecture:** 
- Smart Contracts: Solidity + Foundry + OpenZeppelin
- Frontend: Next.js 14 + wagmi/viem + RainbowKit
- Testing: Forge (unit tests) + Playwright (e2e)

**Tech Stack:** 
- Backend: Solidity ^0.8.20, Foundry, OpenZeppelin ^5.0.0
- Frontend: Next.js 14, React 18, wagmi ^2.x, viem ^2.x, RainbowKit ^2.x

---

## Project Overview

Terdapat 4 project dengan tingkat kesulitan berbeda:

| No. | Project | Tingkat | Estimated Time |
|-----|---------|---------|----------------|
| 1 | CRUD Todo List | Beginner | 4-6 jam |
| 2 | NFT Gated Gallery | Intermediate | 6-8 jam |
| 3 | DeFi Simple Vault | Advanced | 8-10 jam |
| 4 | DAO Voting System | Expert | 10-15 jam |

---

## Task Groups

### Phase 1: Project 1 - Todo List (Beginner)

#### Task 1.1: Setup Environment
- Setup Foundry project
- Install OpenZeppelin contracts

#### Task 1.2: Smart Contract
- Coding Todo.sol dengan struct, mapping, events
- Write unit tests di Foundry

#### Task 1.3: Frontend
- Setup Next.js + wagmi/viem
- Integrasi useReadContract (fetch tasks)
- Integrasi useWriteContract (add/toggle)
- UI Feedback (loading, success)

---

### Phase 2: Project 2 - NFT Gallery (Intermediate)

#### Task 2.1: Smart Contract
- Coding ERC721URIStorage contract
- Implementasi mint, whitelist

#### Task 2.2: IPFS Setup
- Setup Pinata account
- Create metadata JSON structure
- Upload function

#### Task 2.3: Frontend
- Setup RainbowKit
- Check NFT balance (useReadContract)
- Conditional rendering (gating)
- Minting UI

---

### Phase 3: Project 3 - DeFi Vault (Advanced)

#### Task 3.1: Smart Contracts
- Coding MockERC20 (testing token)
- Coding SimpleVault (deposit/withdraw)
- Reward calculation

#### Task 3.2: Frontend
- Approve token UI (Transaction 1)
- Deposit UI (Transaction 2)
- BigInt formatting (formatUnits)
- TVL dashboard
- Error handling

---

### Phase 4: Project 4 - DAO Voting (Expert)

#### Task 4.1: Smart Contracts
- Coding GovernanceToken (ERC20Votes)
- Coding Governor Contract
- Configure voting parameters
- Unit tests

#### Task 4.2: Frontend
- Create proposal form
- Cast vote (For/Against/Abstain)
- Proposal state tracking
- Progress bar results
- Execute proposal

---

## Dependencies

### Global Dependencies
1. Node.js 18+
2. Git
3. Metamask
4. Foundry

### Per-Project Dependencies
- **Todo List:** wagmi, viem, @tanstack/react-query
- **NFT Gallery:** @rainbow-me/rainbowkit, axios (for IPFS)
- **DeFi Vault:** viem (formatUnits)
- **DAO Voting:** -

---

## Notes

- Mulai dari Project 1 dan lanjutkan secara berurutan
- Setiap project membangun pengetahuan dari project sebelumnya
- Untuk testing, gunakan Anvil (local) dulu sebelum testnet
- Untuk DAO Voting, perlu tuning parameter governance (votingDelay, votingPeriod, quorum)

---

## Files Structure

```
justworkonit/
├── docs/web3-projects/
│   ├── 00-overview.mdx
│   ├── 01-todo-list.mdx
│   ├── 02-nft-gallery.mdx
│   ├── 03-defi-vault.mdx
│   └── 04-dao-voting.mdx
├── projects/
│   ├── web3-todo-list/          # Project 1
│   ├── web3-nft-gallery/        # Project 2
│   ├── web3-defi-vault/         # Project 3
│   └── web3-dao-voting/         # Project 4
└── plans/
    └── WEB3-IMPLEMENTATION-PLAN.md
```

---

## Recommended Execution Order

1. **Week 1:** Project 1 - Todo List (Beginner)
2. **Week 2:** Project 2 - NFT Gallery (Intermediate)  
3. **Week 3:** Project 3 - DeFi Vault (Advanced)
4. **Week 4:** Project 4 - DAO Voting (Expert)

Setiap project membutuhkan waktu 1 minggu untuk pemahaman yang baik.
