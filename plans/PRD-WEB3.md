PRD: CRUD Todo List (Beginner)

Deskripsi: Aplikasi manajemen tugas yang berinteraksi langsung dengan smart contract. 
Tujuan: Memahami read/write operations dan event listening di wagmi. 
Fitur Utama:

- Tambah tugas (Write)
- Lihat daftar tugas (Read)
- Update status selesai (Write)
- Real-time update via Events.

TODO:
- [ ] Setup Foundry project & install OpenZeppelin (jika perlu)
- [ ] Coding Todo.sol (Struct Task, Mapping, Add/Toggle functions)
- [ ] Write Unit Tests di Foundry (TDD approach)
- [ ] Setup Next.js & wagmi/viem config (Chains, Providers)
- [ ] Integrasi useReadContract buat fetch list task
- [ ] Integrasi useWriteContract buat add & toggle status task
- [ ] Implementasi UI Feedback (Loading states & Success toast)

PRD: NFT Gated Gallery (Intermediate)

Deskripsi: Website galeri seni digital yang hanya bisa diakses oleh pemegang NFT tertentu. 
Tujuan: Belajar standar ERC-721 dan logic access gating di frontend. 

Fitur Utama:

- Minting NFT sederhana.
- Pengecekan kepemilikan token (balanceOf).
- Halaman khusus "Holder Only".

TODO: 

- [ ] Coding ERC721 Smart Contract pake OpenZeppelin URIStorage
- [ ] Deploy ke Testnet atau Anvil & Set Base URI / Metadata
- [ ] Setup Frontend & Connect Wallet (RainbowKit/ConnectKit)
- [ ] Pake useReadContract buat cek balanceOf user
- [ ] Logic Conditional Rendering buat konten eksklusif (Gating)
- [ ] Integrasi fungsi Minting via useWriteContract
- [ ] Display NFT Metadata (Image & Name) via IPFS gateway

PRD: DeFi Simple Vault (Advanced)

Deskripsi: Protokol tabungan sederhana di mana user bisa deposit ERC-20 untuk mendapatkan imbal hasil (simulasi). 
Tujuan: Belajar interaksi antar kontrak, token allowance, dan kalkulasi BigInt. 

Fitur Utama:

- Approve & Deposit token.
- Withdraw aset + reward.
- Dashboard statistik TVL (Total Value Locked).

TODO: 

- [ ] Coding Vault Contract (Deposit/Withdraw logic atau ERC-4626)
- [ ] Setup Mock ERC-20 Token buat testing deposit
- [ ] Frontend: Implementasi UI Approve Token (Transaction 1)
- [ ] Frontend: Implementasi UI Deposit ke Vault (Transaction 2)
- [ ] Konversi BigInt ke readable format pake formatUnits viem
- [ ] Fetch real-time Balance & Total Assets di Vault
- [ ] Handling error buat insufficient balance/allowance

PRD: DAO Voting System (Expert)

Deskripsi: Platform tata kelola organisasi terdesentralisasi untuk pemungutan suara proposal. 
Tujuan: Implementasi sistem governance yang kompleks dan manajemen state proposal. 

Fitur Utama:

- Pembuatan proposal baru.
- Sistem voting (On-chain).
- Eksekusi otomatis proposal yang lolos.

TODO:

- [ ] Coding Governance Token (ERC20Votes) & Governor Contract
- [ ] Setup Voting Delay, Voting Period, & Quorum di Foundry script
- [ ] Frontend: Form input buat create Proposal baru
- [ ] Implementasi fungsi Cast Vote (For/Against/Abstain) via wagmi
- [ ] Tracking status proposal (State machine: Active, Succeeded, etc)
- [ ] Display list Proposal dengan progress bar hasil voting
- [ ] Fungsi Execute proposal setelah voting sukses & period selesai
