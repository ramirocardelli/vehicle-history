# Service Logs Implementation (UPDATE TOKEN)

## Overview
This implementation allows users to add **immutable service records** to vehicles on the BSV blockchain, creating a permanent, verifiable maintenance history.

## Features Implemented

### ✅ 1. Service Log Database Schema
**Collection**: `serviceLogs`

```javascript
{
  vehicleVin: string,      // Links to vehicle
  serviceType: string,      // e.g. "Oil Change", "Brake Service"
  serviceDate: Date,        // When service was performed
  mileage: number,          // Odometer reading
  description: string,      // Service details
  cost: number | null,      // Optional cost
  receiptUrl: string | null, // Optional UHRP URL (future)
  txid: string,             // Blockchain transaction ID
  onchainAt: Date,          // When logged on blockchain
  logHash: string,          // Base64 hash of log data
  createdAt: Date
}
```

### ✅ 2. Backend API Endpoints

**GET /api/vehicles/:vin/logs**
- Returns all service logs for a vehicle
- Sorted by date (newest first)

**POST /api/vehicles/:vin/logs**
- Creates new service log
- Validates vehicle exists
- Stores blockchain metadata

### ✅ 3. Frontend Components

**AddServiceLog.tsx**
- Form with service type dropdown
- Required fields: type, date, mileage, description
- Optional cost field
- Creates PushDrop token on blockchain
- Collapses into button when not in use

**VehicleDetail.tsx (Enhanced)**
- Shows service history section
- Displays all service logs as cards
- Each log has "View on Chain" link
- Integrates AddServiceLog component

### ✅ 4. Blockchain Integration

Each service log creates a **PushDrop token** with:

```typescript
// Protocol details
protocolID: [0, 'vehicle service log']
keyID: Base64(SHA256(logData))
basket: 'vehicle-service-logs'

// Embedded data
- Service type (UTF-8 bytes)
- Double SHA-256 hash of complete log data
- 1-satoshi output
```

## How It Works

### Adding a Service Log

1. **User fills form**:
   - Service Type (dropdown)
   - Date
   - Mileage
   - Description
   - Cost (optional)

2. **Blockchain token creation**:
   ```typescript
   // Hash the log data
   const dataHash = Hash.sha256(JSON.stringify(logData));
   const doubleHash = Hash.sha256(dataHash);
   
   // Create PushDrop token
   const pushdrop = new PushDrop(wallet);
   const lockingScript = await pushdrop.lock(
     [Utils.toArray(serviceType, 'utf8'), doubleHash],
     customInstructions.protocolID,
     customInstructions.keyID,
     'self', true, true, 'after'
   );
   
   // Broadcast via wallet.createAction()
   const res = await wallet.createAction({...});
   const tx = Transaction.fromAtomicBEEF(res.tx);
   await tx.broadcast(new ARC('https://arc.taal.com'));
   ```

3. **Database storage**:
   - Save to `serviceLogs` collection
   - Include txid, hash, timestamp

### Viewing Service History

- Service logs displayed chronologically
- Each card shows:
  - Service type (as heading)
  - Date and mileage
  - Cost (if provided)
  - Description
  - "View on Chain" link to WhatsOnChain

## Service Type Options

Pre-populated dropdown:
- Oil Change
- Tire Rotation
- Brake Service
- Transmission Service
- Engine Repair
- Battery Replacement
- Air Filter Replacement
- Wheel Alignment
- Inspection
- Other

## Cost Tracking

Each service log costs **1 satoshi** plus transaction fees (typically 3-5 sats total). This is funded from the user's BSV Desktop wallet.

## Security & Verification

### Cryptographic Proof
- Each log is hashed (SHA-256 double hash)
- Hash embedded in blockchain token
- Cannot be modified without changing hash
- Timestamp proves when service occurred

### Public Verification
- Anyone can verify logs via WhatsOnChain
- Transaction ID provides immutable proof
- Chain of logs creates complete maintenance history

## Future Enhancements

### UHRP Receipt Upload (Mentioned in Requirements)
```typescript
// Add file upload to form
const receiptUrl = await uploadToUHRP(file);

// Include in blockchain data
const logData = {
  ...existingData,
  receiptUrl
};
```

### Token Spending Chain
Following natural-chain pattern, you could spend previous service log tokens to create an immutable chain:

```typescript
// Find last service log for this vehicle
const previousLog = await getLatestServiceLog(vin);

// Spend it to create new log (creates chain)
const unlockingScript = pushdrop.unlock(
  previousLog.protocolID,
  previousLog.keyID,
  'self', 'single', true, 1,
  previousLog.lockingScript
);

// This creates verifiable chain of custody
```

### SPV Proofs
Generate merkle proofs for each log entry for lightweight verification without full blockchain.

## Testing

1. Navigate to a vehicle detail page
2. Click "+ Add Service Log"
3. Fill in the form:
   - Select service type
   - Enter date and mileage
   - Add description
   - Optionally add cost
4. Click "Add Service Log"
5. Transaction broadcast to blockchain
6. Log appears in service history with blockchain link

## Database Queries

Get all logs for a vehicle:
```javascript
db.serviceLogs.find({ vehicleVin: "VIN123" }).sort({ serviceDate: -1 })
```

Get logs by service type:
```javascript
db.serviceLogs.find({ serviceType: "Oil Change" })
```

Get logs with costs:
```javascript
db.serviceLogs.find({ cost: { $ne: null } })
```

## UI/UX Features

- ✅ Collapsible form (shows button when not adding)
- ✅ Required field validation
- ✅ Loading states during blockchain broadcast
- ✅ Error handling and display
- ✅ Clean card layout for log display
- ✅ WhatsOnChain integration
- ✅ Responsive design

## Benefits

1. **Immutable Records**: Cannot be altered or deleted
2. **Timestamped**: Blockchain provides proof of when service occurred
3. **Transparent**: Anyone can verify via blockchain explorer
4. **Low Cost**: ~5 satoshis per log entry
5. **Permanent**: Stored forever on BSV blockchain
6. **Trustless**: No need to trust seller claims about maintenance
