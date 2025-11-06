#!/usr/bin/env node
/*
  Simple MongoDB seed script for vehicles collection.
  Usage:
    node backend/scripts/seedVehicles.js [mongoUri]

  If no mongoUri argument is provided, the script reads MONGO_URL or defaults
  to mongodb://localhost:27017/vehicle-history
*/

const { MongoClient } = require("mongodb");

const arg = process.argv[2];
const mongoUrl = arg || process.env.MONGO_URL || process.env.MONGO_URI || "mongodb://localhost:27017/vehicle-history";

const sampleVehicles = [
  {
    vin: "1HGCM82633A004352",
    make: "Honda",
    model: "Accord",
    year: 2003,
    currentMileage: 152345,
    ownerAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    tokenId: "token-1001",
    metadata: { color: "silver", notes: "Regular maintenance" },
  },
  {
    vin: "JH4KA8260MC000000",
    make: "Acura",
    model: "Legend",
    year: 1991,
    currentMileage: 234000,
    ownerAddress: "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
    tokenId: "token-1002",
    metadata: { color: "black", notes: "Classic, restored interior" },
  },
  {
    vin: "WDBJF65JYXA000000",
    make: "Mercedes-Benz",
    model: "E320",
    year: 1999,
    currentMileage: 189500,
    ownerAddress: "1dice8EMZmqKvrGE4Qc9bUFf9PX3xaYDp",
    tokenId: "token-1003",
    metadata: { color: "blue", notes: "Imported" },
  },
  {
    vin: "3FAFP31381R000000",
    make: "Ford",
    model: "Focus",
    year: 2008,
    currentMileage: 98000,
    ownerAddress: "1BsBN8BvjvrjJUC43Ui6KwuLXW8yTWuimn",
    tokenId: "token-1004",
    metadata: { color: "white", notes: "Fleet vehicle" },
  },
  {
    vin: "5YJ3E1EA7KF000000",
    make: "Tesla",
    model: "Model 3",
    year: 2019,
    currentMileage: 42000,
    ownerAddress: "1BsBN8BvjvrjJUC43Ui6KwuLXW8yTWuimn",
    tokenId: "token-1005",
    metadata: { color: "red", notes: "EV — battery health good" },
  },
];

async function main() {
  console.log("Connecting to MongoDB:", mongoUrl);
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    const dbName = client.db().databaseName || "vehicle-history";
    const db = client.db();
    console.log("Using database:", db.databaseName || dbName);

    const col = db.collection("vehicles");

    for (const v of sampleVehicles) {
      const filter = { vin: v.vin };
      const update = {
        $set: Object.assign({}, v, { lastUpdated: new Date() }),
        $setOnInsert: { createdAt: new Date() },
      };
      const res = await col.updateOne(filter, update, { upsert: true });
      if (res.upsertedId) {
        console.log(`Inserted vehicle VIN=${v.vin}`);
      } else if (res.matchedCount) {
        console.log(`Updated vehicle VIN=${v.vin}`);
      } else {
        console.log(`No-op for VIN=${v.vin}`);
      }
    }

    const count = await col.countDocuments();
    console.log(`Vehicles collection now has ${count} documents.`);
  } catch (err) {
    console.error("Failed to seed vehicles:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
