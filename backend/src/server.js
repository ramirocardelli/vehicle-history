const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 4001;
const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/vehicle-history';

let db;

async function start() {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db();
  console.log('Connected to MongoDB:', mongoUrl, 'DB:', db.databaseName);
  // JSON body parser
  app.use(express.json());

  // Simple CORS handling so the frontend (vite) can call this API during dev.
  app.use((req, res, next) => {
    // Allow Vite dev server origin by default, adjust if needed for production
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN || 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    // Handle preflight
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  app.get('/api/vehicles', async (req, res) => {
    try {
      const col = db.collection('vehicles');
      const docs = await col.find().toArray();
      res.json(docs.map(d => ({ vin: d.vin, make: d.make, model: d.model, year: d.year, ownerAddress: d.ownerAddress, tokenId: d.tokenId })));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to list vehicles' });
    }
  });

  app.get('/api/vehicles/:vin', async (req, res) => {
    try {
      const vin = req.params.vin;
      const col = db.collection('vehicles');
      const doc = await col.findOne({ vin });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to get vehicle' });
    }
  });

  // Create a new vehicle. VIN must be unique.
  app.post('/api/vehicles', async (req, res) => {
    try {
      const body = req.body || {};
      const { vin, make, model, year, currentMileage, ownerAddress, metadata, tokenId, onchainAt, vehicleHash } = body;
      if (!vin || !make || !model || !year || !ownerAddress) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const col = db.collection('vehicles');
      const existing = await col.findOne({ vin });
      if (existing) return res.status(409).json({ error: 'VIN already exists' });

      // Prepare document with blockchain data
      const now = new Date();
      const doc = {
        vin,
        make,
        model,
        year,
        currentMileage: currentMileage ?? null,
        ownerAddress,
        tokenId: tokenId || null,
        onchainAt: onchainAt ? new Date(onchainAt) : null,
        vehicleHash: vehicleHash || null,
        metadata: metadata || {},
        createdAt: now,
        lastUpdated: now,
      };

      const r = await col.insertOne(doc);
      res.status(201).json(Object.assign({ _id: r.insertedId }, doc));
    } catch (err) {
      console.error('Failed to create vehicle', err);
      res.status(500).json({ error: 'Failed to create vehicle' });
    }
  });

  // Service Logs endpoints
  app.get('/api/vehicles/:vin/logs', async (req, res) => {
    try {
      const vin = req.params.vin;
      const col = db.collection('serviceLogs');
      const logs = await col.find({ vehicleVin: vin }).sort({ serviceDate: -1 }).toArray();
      res.json(logs);
    } catch (err) {
      console.error('Failed to get service logs', err);
      res.status(500).json({ error: 'Failed to get service logs' });
    }
  });

  app.post('/api/vehicles/:vin/logs', async (req, res) => {
    try {
      const vin = req.params.vin;
      const body = req.body || {};
      const { serviceType, serviceDate, mileage, description, cost, receiptUrl, txid, onchainAt, logHash } = body;
      
      if (!serviceType || !serviceDate || !mileage || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify vehicle exists
      const vehicleCol = db.collection('vehicles');
      const vehicle = await vehicleCol.findOne({ vin });
      if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

      const col = db.collection('serviceLogs');
      const now = new Date();
      const doc = {
        vehicleVin: vin,
        serviceType,
        serviceDate: new Date(serviceDate),
        mileage: Number(mileage),
        description,
        cost: cost ? Number(cost) : null,
        receiptUrl: receiptUrl || null,
        txid: txid || null,
        onchainAt: onchainAt ? new Date(onchainAt) : null,
        logHash: logHash || null,
        createdAt: now,
      };

      const r = await col.insertOne(doc);
      res.status(201).json(Object.assign({ _id: r.insertedId }, doc));
    } catch (err) {
      console.error('Failed to create service log', err);
      res.status(500).json({ error: 'Failed to create service log' });
    }
  });

  app.listen(port, () => console.log(`Backend API listening on http://localhost:${port}`));
}

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
