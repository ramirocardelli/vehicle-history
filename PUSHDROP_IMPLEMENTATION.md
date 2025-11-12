# PushDrop Token Implementation for Vehicle History

## Overview
This implementation creates a **PushDrop token** on the BSV blockchain for each vehicle using the BSV SDK, following the pattern from the natural-chain demo.

## How It Works

### 1. Frontend Token Creation (`CreateVehicle.tsx`)

When a user creates a vehicle token:

```typescript
// 1. Hash the vehicle data
const dataHash = Hash.sha256(JSON.stringify(vehicleData));
const doubleHash = Hash.sha256(dataHash);

// 2. Create PushDrop token with custom instructions
const pushdrop = new PushDrop(wallet);
const customInstructions = {
  protocolID: [0, 'vehicle history'] as WalletProtocol,
  keyID: Utils.toBase64(dataHash)
};

// 3. Create locking script
const lockingScript = await pushdrop.lock(
  [Utils.toArray(vin, 'utf8'), doubleHash],
  customInstructions.protocolID,
  customInstructions.keyID,
  'self',
  true,
  true,
  'after'
);

// 4. Create transaction with wallet.createAction()
const outputs = [{
  lockingScript: lockingScript.toHex(),
  satoshis: 1,
  outputDescription: 'vehicle history token',
  customInstructions: JSON.stringify(customInstructions),
  basket: 'vehicle-history'
}];

const res = await wallet.createAction({
  description: 'create vehicle token for blockchain-based service history',
  outputs,
  options: {
    randomizeOutputs: false
  }
});

// 5. Broadcast to BSV blockchain
const tx = Transaction.fromAtomicBEEF(res.tx as number[]);
const arc = await tx.broadcast(new ARC('https://arc.taal.com'));
```

### 2. Backend Storage (`server.js`)

The backend now accepts the blockchain data from the frontend:

- **txid**: Transaction ID from blockchain
- **onchainAt**: Timestamp when token was created

### 3. Database Schema

Each vehicle document in MongoDB contains:

```javascript
{
  vin: string,
  make: string,
  model: string,
  year: number,
  currentMileage: number | null,
  ownerAddress: string,
  txid: string,           // txid from blockchain
  onchainAt: Date,            // when token was created
  createdAt: Date,
  lastUpdated: Date
}
```

## Key Features

### 🔐 Cryptographic Proof
- Double SHA-256 hash of vehicle data embedded in token
- PushDrop locking script ensures only wallet owner can spend
- VIN included as first data field in token

### 🔗 Blockchain Integration
- 1-satoshi output for minimal cost
- Custom protocol ID: `'vehicle history'`
- keyID based on vehicle data hash for uniqueness
- Basket organization: `'vehicle-history'`

### 📦 Wallet Integration
- Uses BSV Desktop wallet via `WalletClient`
- `createAction()` handles transaction construction and signing
- ARC broadcast for instant confirmation

### 🎯 Token Structure

The PushDrop token contains:
1. **VIN** (as UTF-8 bytes)
2. **Double hash** of complete vehicle data
3. **Protocol ID**: `[0, 'vehicle history']`
4. **Key ID**: Hash of vehicle data (for future lookups)

## Future Extensions

### Service Log Updates (UPDATE TOKEN)
Following the natural-chain pattern, you can later spend this token to create an immutable chain of service history:

```typescript
// When adding a service log, spend the previous token
const unlockingScriptTemplate = pushdrop.unlock(
  customInstructions.protocolID,
  customInstructions.keyID,
  'self',
  'single',
  true,
  1,
  previousToken.lockingScript
);

// Create new token with service data
// This creates a blockchain-based chain of custody
```

### UTXO Tracking
The database can track:
- `vout`: Output index (usually 0)
- Token spent/unspent status
- Service log chain via input references

## References

- **Natural Chain Demo**: https://github.com/bsv-blockchain-demos/natural-chain
- **BSV SDK Docs**: https://docs.bsvblockchain.org/
- **PushDrop Protocol**: Token protocol for data ownership
- **ARC**: Atomic Record Chain for instant broadcast

## Testing

1. Connect BSV Desktop wallet
2. Navigate to "Create Token"
3. Fill in vehicle details (VIN, make, model, year)
4. Click "Create Token"
5. Token is created on-chain and txid stored in database
6. View vehicle detail to see `txid` and blockchain metadata

## Cost

Each vehicle token costs **1 satoshi** plus transaction fees (typically a few satoshis), making this extremely cost-effective for permanent, immutable vehicle records.
