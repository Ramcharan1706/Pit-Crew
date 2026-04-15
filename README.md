# Pitcrew – DeFi Intent Automation on Algorand

Pitcrew is a DeFi application on Algorand that enables users to create conditional trading intents and execute them automatically when predefined conditions are met.

---

## Project Structure

```
projects/
├── Pitcrew-frontend/     # React + TypeScript UI
├── Pitcrew-backend/      # Node.js + Express API
└── Pitcrew-contracts/    # PyTeal smart contracts
```

---

## Prerequisites

* Node.js 20+
* Python 3.10+
* Docker (for Algorand localnet)
* AlgoKit CLI (recommended)

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-org/Pit-Crew.git
cd Pit-Crew
```

### Install Dependencies

**Using AlgoKit (recommended):**

```bash
algokit project bootstrap all
```

**Manual Setup:**

```bash
# Frontend
cd projects/Pitcrew-frontend && npm install && cd ../..

# Backend
cd projects/Pitcrew-backend && npm install && cd ../..

# Contracts
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate (Windows)
pip install -r requirements.txt
```

---

## Environment Configuration

### Backend (`projects/Pitcrew-backend/.env`)

```env
DATABASE_URL=file:./dev.db
ALGOD_SERVER=<algorand_node_url>
ALLOWED_ORIGINS=http://localhost:5173
```

### Contracts

```bash
cd projects/Pitcrew-contracts
algokit generate env-file -a target_network localnet
```

---

## Running the Application

### Start Backend

```bash
cd projects/Pitcrew-backend
npm run dev
```

### Start Frontend

```bash
cd projects/Pitcrew-frontend
npm run dev
```

### Run Contracts (optional)

```bash
cd projects/Pitcrew-contracts
npm run dev
```

---

## Core Components

### Frontend

* UI for creating and managing intents
* Wallet integration
* Real-time updates via WebSockets

### Backend

* API for intent management
* Price monitoring and trigger evaluation
* WebSocket server for notifications

### Smart Contracts

* Store and validate user intents
* Execute transactions on-chain

---

## Key Features

* Conditional trading intents
* Automated execution
* Real-time notifications
* On-chain validation

---

## Database

Run migrations:

```bash
cd projects/Pitcrew-backend
npx prisma migrate dev
```

View database:

```bash
npx prisma studio
```

---

## Build

```bash
algokit project run build
```

---

## Notes

* SQLite is used for development; use PostgreSQL in production
* Ensure Algorand node access is configured
* Deploy contracts before production use

---

## License

Add your license here.
