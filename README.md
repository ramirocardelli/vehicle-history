# Vehicle History - Blockchain Service Proof

A blockchain-based vehicle maintenance tracking system built on BSV (Bitcoin SV). This application demonstrates how to create immutable, timestamped service records that prove vehicle care history.

## Overview

Vehicle History allows users to:
- Create vehicle tokens with VIN, make, model, year, and mileage
- Log maintenance service records on the blockchain
- View complete vehicle history with blockchain verification
- Export service history as PDF reports
- Search vehicles by VIN

All vehicle data and service logs are stored on-chain using PushDrop tokens, providing cryptographic proof of maintenance history.

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite (development server)
- @bsv/sdk for blockchain operations
- jsPDF for PDF generation

### Backend
- Node.js with Express
- MongoDB for data storage
- BSV SDK for blockchain integration

### Blockchain
- BSV (Bitcoin SV) blockchain
- PushDrop token protocol
- WhatsOnChain explorer integration

## Prerequisites

Before running the application, ensure you have the following installed:

1. **Docker** - For running MongoDB
2. **Node.js** (v18 or higher)
3. **BSV Desktop Wallet** - Download from [https://desktop.bsvb.tech/](https://desktop.bsvb.tech/)
4. **LARS** For local blockchain testing

## Setup Instructions

### 1. Install BSV Desktop Wallet

Download and install the BSV Desktop Wallet from the official website. This wallet is required for authenticating and signing transactions.

### 2. Install Dependencies

#### Backend:
```bash
cd backend
npm install
```

#### Frontend:
```bash
cd frontend
npm install
```

### 3. Start LARS

LARS provides a local blockchain environment for testing without spending real satoshis.

```bash
lars
```

When prompted:
1. Select **"Start LARS (local only)"**
2. Choose **"Continue without funding"**

LARS will now be running on your local machine.

The frontend will be available at `http://localhost:5173`

### 4. Start the Backend

```bash
cd backend
npm run start
```

The backend API will be available at `http://localhost:4001`

## Usage

### 1. Connect Your Wallet

1. Open the application in your browser (`http://localhost:5173`)
2. Click **"Connect BSV Desktop"** in the header
3. Authenticate in the BSV Desktop Wallet when prompted

### 2. Create a Vehicle Token

1. Click **"Create Token"** in the header
2. Fill in the vehicle details:
   - VIN (Vehicle Identification Number)
   - Make (e.g., Toyota)
   - Model (e.g., Corolla)
   - Year
   - Current Mileage
3. Click **"Create Token"**
4. Approve the transaction in BSV Desktop Wallet

The vehicle token will be created on the blockchain and stored in the database.

### 3. Add Service Logs

1. Navigate to a vehicle detail page
2. Click **"+ Add Service Log"**
3. Fill in the service details:
   - Service Type (Oil Change, Tire Rotation, etc.)
   - Service Date
   - Mileage at time of service
   - Description
   - Cost (optional)
4. Click **"Create Service Log"**
5. Approve the transaction in BSV Desktop Wallet

Each service log creates a new PushDrop token on the blockchain.

### 4. View Vehicle History

- **Search by VIN**: Use the search bar on the home page
- **Browse All**: Scroll through the list of all vehicles
- **View Details**: Click "View" on any vehicle card

### 5. Export PDF Report

On the vehicle detail page:
1. Click **"Export PDF"**
2. A PDF will download automatically with:
   - Complete vehicle information
   - All service logs
   - Blockchain transaction IDs
   - WhatsOnChain verification links

## Features

### ✅ Implemented

- **Wallet Authentication**: BSV Desktop Wallet integration
- **Vehicle Token Creation**: Create vehicle records on blockchain
- **Service Log Tokens**: Add maintenance records as PushDrop tokens
- **Full Data On-Chain**: Complete vehicle/log data stored on blockchain (not just hashes)
- **VIN Search**: Search vehicles by VIN number
- **PDF Export**: Download service history reports
- **Blockchain Verification**: WhatsOnChain links for all transactions
- **Responsive Design**: Mobile-friendly interface (desktop-first)

## Project Structure

```
vehicle-history/
├── backend/
│   ├── src/
│   │   └── server.js          # Express API server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main application component
│   │   ├── CreateVehicle.tsx  # Vehicle creation form
│   │   ├── VehicleDetail.tsx  # Vehicle detail view
│   │   ├── AddServiceLog.tsx  # Service log form
│   │   ├── exportPDF.ts       # PDF generation utility
│   │   ├── types.ts           # TypeScript type definitions
│   │   └── index.css          # Global styles
│   ├── index.html
│   └── package.json
└── README.md
```

## API Endpoints

### Vehicles

- `GET /api/vehicles` - List all vehicles
- `GET /api/vehicles/:vin` - Get vehicle by VIN
- `POST /api/vehicles` - Create new vehicle

### Service Logs

- `GET /api/vehicles/:vin/logs` - Get service logs for vehicle
- `POST /api/vehicles/:vin/logs` - Create new service log

## Database Schema

### Vehicles Collection
```javascript
{
  vin: String,
  make: String,
  model: String,
  year: Number,
  currentMileage: Number,
  ownerAddress: String,
  tokenId: String,        // Blockchain token ID
  onchainAt: Date,        // Timestamp of blockchain creation
  createdAt: Date,
  lastUpdated: Date
}
```

### ServiceLogs Collection
```javascript
{
  vehicleVin: String,
  serviceType: String,
  serviceDate: Date,
  mileage: Number,
  description: String,
  cost: Number,
  txid: String,          // Blockchain transaction ID
  onchainAt: Date,
  logHash: String,
  createdAt: Date
}
```

## Blockchain Details

### PushDrop Token Protocol

Each vehicle and service log is stored as a PushDrop token with:
- **Protocol ID**: `[0, 'vehicle history']` or `[0, 'vehicle service log']`
- **Data Storage**: Full data embedded as UTF-8 arrays
- **Cost**: ~2 satoshis per transaction
- **Verification**: All data publicly readable on-chain via WhatsOnChain

### Data Stored On-Chain

**Vehicle Token:**
- VIN
- Make
- Model
- Year
- Mileage
- Owner Address
- Complete JSON object

**Service Log Token:**
- Service Type
- Service Date
- Mileage
- Description
- Cost
- VIN (links to vehicle)
- Complete JSON object

## Documentation

- [PushDrop Implementation](./PUSHDROP_IMPLEMENTATION.md) - Token creation details
- [On-Chain Data Storage](./ONCHAIN_DATA_STORAGE.md) - Full data storage explanation
- [PDF Export](./PDF_EXPORT.md) - PDF generation documentation
- [Service Logs Implementation](./SERVICE_LOGS_IMPLEMENTATION.md) - Service log system

## Contributing

This is a demo project showcasing BSV blockchain capabilities for automotive trust and transparency.

## Contact

For questions or support, please contact the development team.

---

**Built with ❤️ on BSV Blockchain**
