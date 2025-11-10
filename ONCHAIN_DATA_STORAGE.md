# On-Chain Data Storage

## Overview
This implementation stores **FULL vehicle and service log data** directly on the BSV blockchain, not just hashes. BSV's unlimited block size makes this possible and cost-effective.

## What's Stored On-Chain

### Vehicle Token Creation
Each vehicle token embeds the following data fields on the blockchain:

```javascript
PushDrop Token Fields:
1. VIN (as UTF-8 text)
2. Make (as UTF-8 text)
3. Model (as UTF-8 text)
4. Year (as UTF-8 text)
5. Mileage (as UTF-8 text)
6. Owner Address (as UTF-8 text)
7. Complete JSON object with all vehicle data

Example on-chain data:
- "1HGCM82633A004352"
- "Honda"
- "Accord"
- "2020"
- "45000"
- "1BsBN8BvjvrjJUC43Ui6KwuLXW8yTWuimn"
- {"vin":"1HGCM82633A004352","make":"Honda","model":"Accord",...}
```

### Service Log Tokens
Each service log embeds:

```javascript
PushDrop Token Fields:
1. Service Type (as UTF-8 text)
2. Service Date (as UTF-8 text)
3. Mileage (as UTF-8 text)
4. Description (as UTF-8 text)
5. Cost (as UTF-8 text)
6. VIN (as UTF-8 text)
7. Complete JSON object with all log data

Example on-chain data:
- "Oil Change"
- "2025-11-10"
- "45000"
- "Changed oil and filter, used synthetic 5W-30"
- "75.50"
- "1HGCM82633A004352"
- {"vehicleVin":"...","serviceType":"Oil Change",...}
```

## Benefits of Full Data On-Chain

### ✅ Complete Transparency
- Anyone can read the full vehicle history directly from the blockchain
- No need to trust a database or third party
- Data is publicly verifiable forever

### ✅ Permanent Archive
- Data stored on BSV blockchain is permanent
- Cannot be deleted or modified
- Survives even if databases or companies disappear

### ✅ No Hash Lookups Required
- Don't need to store data elsewhere and just keep hashes
- Full data is immediately readable from blockchain
- Simplifies architecture

### ✅ Timestamped & Ordered
- Blockchain provides immutable timestamps
- Service logs appear in chronological order
- Proof of when each service occurred

## How to View On-Chain Data

### Using WhatsOnChain Explorer

1. Click the tokenId link on any vehicle
2. View the transaction on WhatsOnChain
3. Navigate to the "Script" tab
4. You'll see all the embedded data fields

### Example Transaction Structure
```
Output #0 (1 satoshi):
  OP_FALSE OP_RETURN
  <protocol-id>
  <field-1: VIN>
  <field-2: Make>
  <field-3: Model>
  <field-4: Year>
  <field-5: Mileage>
  <field-6: Owner>
  <field-7: Full JSON>
```

## Cost Analysis

### Vehicle Token (~200 bytes)
- Base data: ~150 bytes
- Full JSON: ~50 bytes
- **Cost: ~5-10 satoshis** (fractions of a cent)

### Service Log (~300 bytes)
- Individual fields: ~100 bytes
- Description: ~100 bytes
- Full JSON: ~100 bytes
- **Cost: ~8-15 satoshis** (fractions of a cent)

### Yearly Cost Example
- 1 vehicle creation: ~10 sats
- 4 service logs/year: ~50 sats
- **Total: ~60 satoshis/year** (~$0.03 USD at $50/BSV)

## Data Verification

The hash stored in the `keyID` allows verification:
```javascript
// Verify data integrity
const storedHash = customInstructions.keyID;
const computedHash = Utils.toBase64(Hash.sha256(JSON.stringify(vehicleData)));

if (storedHash === computedHash) {
  console.log('✅ Data verified - matches blockchain record');
}
```

## Reading On-Chain Data (Future Enhancement)

You could add a feature to read data directly from blockchain:

```typescript
async function getVehicleFromBlockchain(txid: string) {
  // Fetch transaction from blockchain
  const tx = await fetchTransaction(txid);
  
  // Parse PushDrop outputs
  const script = tx.outputs[0].lockingScript;
  
  // Extract fields
  const fields = parsePushDropFields(script);
  
  return {
    vin: fields[0],
    make: fields[1],
    model: fields[2],
    year: fields[3],
    mileage: fields[4],
    owner: fields[5],
    fullData: JSON.parse(fields[6])
  };
}
```

## Privacy Considerations

⚠️ **Important**: All data stored on-chain is **public and permanent**

- Anyone can read the blockchain
- Data cannot be deleted
- Consider this when storing sensitive information
- For this demo, vehicle maintenance data is appropriate
- For production, consider what should/shouldn't be public

## Comparison: Hash vs Full Data

### Just Hash (Old)
```
Storage: Just 32-byte SHA-256 hash
Cost: ~2 sats
Retrieval: Need separate database
Trust: Must trust off-chain storage
```

### Full Data (New)
```
Storage: Complete vehicle/log data
Cost: ~10 sats (still minimal)
Retrieval: Read directly from blockchain
Trust: Completely trustless
```

## Why BSV Can Do This

Unlike Bitcoin (BTC) or other cryptocurrencies:

- **Unlimited block size** - No artificial 1MB limit
- **Low fees** - Fractions of a cent per transaction
- **Designed for data** - Original Bitcoin whitepaper supported data storage
- **Scales horizontally** - Can handle millions of transactions

## Technical Details

### PushDrop Protocol
The data is embedded using the PushDrop protocol which creates outputs with:
- 1-satoshi value (minimal but spendable)
- OP_RETURN script with data fields
- Custom protocol identifier
- Spendable with wallet signature

### Encoding
All data is UTF-8 encoded text:
```javascript
Utils.toArray(stringData, 'utf8') // Converts to bytes for blockchain
```

### Transaction Format
Uses BEEF (Background Evaluation Extended Format) for efficient transmission and verification.

## Future Enhancements

### Add Images
Store receipt photos on-chain using UHRP:
```javascript
const imageHash = await uploadToBlockchain(receiptImage);
// Include imageHash in service log data
```

### Add PDF Reports
Generate and store PDF service history:
```javascript
const pdfData = generatePDF(vehicleLogs);
const pdfTxid = await storeOnChain(pdfData);
```

### Overlay Services
Index all vehicle tokens for fast lookup:
- SHIP: Broadcast tokens to overlay network
- SLAP: Query vehicles by VIN, owner, etc.
- Fast retrieval without scanning entire blockchain

## Summary

✅ **Full vehicle data** stored on BSV blockchain  
✅ **Full service log data** stored on-chain  
✅ **Public & permanent** - verifiable forever  
✅ **Low cost** - pennies per year  
✅ **No database dependency** - can rebuild from blockchain  
✅ **Trustless** - cryptographically secured  

This creates a **permanent, public, verifiable vehicle service history** that will exist forever on the BSV blockchain! 🚗⛓️
