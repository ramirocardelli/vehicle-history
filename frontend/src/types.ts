export type Metadata = {
  color?: string;
  notes?: string;
  [key: string]: unknown;
};

export type Vehicle = {
  id: string;           // unique identifier (UUID or database id)
  make: string;         // e.g. "Toyota"
  model: string;        // e.g. "Corolla"
  year: number;         // e.g. 2020
  vin: string;         // optional vehicle identification number
  color?: string;
  mileage?: number;
  ownerId?: string;     // optional reference to an owner record
  createdAt?: string;   // ISO timestamp
  updatedAt?: string;   // ISO timestamp
  tokenId: string;      // blockchain token identifier
  ownerAddress: string; // blockchain owner address
  currentMileage?: number; // current mileage on the blockchain
  metadata?: Metadata;
};