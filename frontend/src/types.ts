export type Vehicle = {
  _id: string;           // unique identifier (UUID or database id)
  make: string;         // e.g. "Toyota"
  model: string;        // e.g. "Corolla"
  year: number;         // e.g. 2020
  vin: string;         // optional vehicle identification number
  mileage?: number;
  ownerId?: string;     // optional reference to an owner record
  createdAt?: string;   // ISO timestamp
  updatedAt?: string;   // ISO timestamp
  txid: string;      // blockchain token identifier
  ownerAddress: string; // blockchain owner address
  currentMileage?: number; // current mileage on the blockchain
  onchainAt?: string;   // ISO timestamp when token was created on-chain
};

export type ServiceLog = {
  _id?: string;
  vehicleVin: string;
  serviceType: string;  // e.g. "Oil Change", "Tire Rotation", "Brake Service"
  serviceDate: string;  // ISO date string
  mileage: number;      // odometer reading at time of service
  description: string;  // service details
  cost?: number;        // optional cost of service
  receiptUrl?: string;  // optional UHRP URL for receipt image
  txid?: string;        // blockchain transaction ID
  onchainAt?: string;   // ISO timestamp when log was created on-chain
  logHash?: string;     // hash of service log data
  createdAt?: string;
};