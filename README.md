# 🎰 Lusio Casino - Web3 Gaming Platform on ONE Chain

A fully decentralized casino platform built on ONE Chain blockchain featuring multiple provably fair games with real cryptocurrency betting.
.
## 🎮 Games Available

### 1. 🚀 Crash (Aviator Style)
- **Real-time multiplier game** - Watch the rocket fly and cash out before it crashes!
- **Provably fair** - Random crash points generated on blockchain
- **Dynamic gameplay** - Multiplier increases from 1.00x to crash point
- **Instant cashout** - Land your plane anytime to secure profits
- **Beautiful animations** - Smooth graph visualization and flying rocket

### 2. 💣 Mines
- **Grid-based game** - Click tiles to reveal safe spots
- **Configurable difficulty** - Choose number of mines (1-24)
- **Progressive multiplier** - Each safe tile increases your payout
- **Strategic gameplay** - Cash out anytime or risk it for higher rewards

### 3. 🎲 Slide
- **Multiplier prediction game**
- **Choose your target** - Set your desired multiplier
- **Instant results** - Fast-paced gameplay
- **High RTP** - Fair odds and transparent payouts

### 4. 🃏 Video Poker
- **Classic 5-card poker**
- **Multiple hand rankings** - Royal Flush, Straight Flush, Four of a Kind, etc.
- **Strategic decisions** - Choose which cards to hold
- **Big payouts** - Up to 800x for Royal Flush

## Gallery 
<img width="1920" height="847" alt="image" src="https://github.com/user-attachments/assets/c688f343-4829-4557-b701-ab1a32da0e4b" />
<img width="1920" height="851" alt="image" src="https://github.com/user-attachments/assets/c4b13a0d-94fe-47e0-8e4e-00613f2673cb" />
<img width="1920" height="842" alt="image" src="https://github.com/user-attachments/assets/f4ec88f2-f0c1-4ecb-9991-c225e076aa28" />
<img width="1920" height="968" alt="image" src="https://github.com/user-attachments/assets/1fb6c9dc-9d7f-42c1-af63-504695fdc6fe" />
<img width="1904" height="884" alt="image" src="https://github.com/user-attachments/assets/33c64b4d-aba4-4525-943c-be268122a366" />

![image](https://github.com/user-attachments/assets/da090469-1d51-4429-bb21-6655f6aa1e9c)
<img width="1907" height="897" alt="image" src="https://github.com/user-attachments/assets/7d58a0d9-5dcf-4235-be30-ba89456aada8" />

![image](https://github.com/user-attachments/assets/b2b90fef-83c3-4f65-b58d-7fca437c874c)
![image](https://github.com/user-attachments/assets/a732dae3-f60a-4d3b-9763-569e44d5284c)


## 🏗️ Technology Stack

### Blockchain
- **ONE Chain Testnet** - Fast, low-cost transactions
- **Move Language** - Secure smart contracts
- **Sui SDK** - Blockchain integration

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling
- **HeroUI** - Beautiful UI components
- **@mysten/dapp-kit** - Wallet integration

### Smart Contracts
- **Move modules** - Deployed on ONE Chain
- **Shared objects** - Game pools and treasuries
- **Events** - Real-time game updates
- **Provably fair** - On-chain randomness

## 📦 Project Structure

```
Lusio-Casino/
├── move_contracts/          # Smart contracts
│   ├── crash/              # Crash game contract
│   ├── mines/              # Mines game contract
│   ├── slide/              # Slide game contract
│   └── videopoker/         # Poker game contract
├── src/
│   ├── app/                # Next.js pages
│   │   ├── crash/         # Crash game page
│   │   ├── mine/          # Mines game page
│   │   ├── slide/         # Slide game page
│   │   └── poker/         # Poker game page
│   ├── components/         # React components
│   │   ├── FlyingAnimation.tsx
│   │   ├── BettingModal.tsx
│   │   ├── TransactionHistory.tsx
│   │   └── WalletProtection.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useCrashGame.ts
│   │   ├── useMinesGame.ts
│   │   └── useSlideGame.ts
│   ├── layout/            # Layout components
│   └── providers/         # Context providers
├── .env.local             # Environment variables
└── package.json           # Dependencies

```
