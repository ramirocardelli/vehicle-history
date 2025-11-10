import { PushDrop, WalletClient, Hash, Utils, Transaction, ARC } from "@bsv/sdk";
import type { WalletProtocol } from "@bsv/sdk";
import { useState } from "react";

type AddServiceLogProps = {
  vin: string;
  wallet: WalletClient | null;
  onLogCreated: () => void;
};

export default function AddServiceLog({ vin, wallet, onLogCreated }: AddServiceLogProps) {
  const [serviceType, setServiceType] = useState("");
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState<number | ''>('');
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!wallet) return setError('You must be connected to add service logs');
    if (!serviceType || !serviceDate || !mileage || !description) {
      return setError('Please fill all required fields');
    }

    try {
      setLoading(true);

      // Create service log data object
      const logData = {
        vehicleVin: vin,
        serviceType,
        serviceDate,
        mileage: Number(mileage),
        description,
        cost: cost === '' ? null : Number(cost),
        timestamp: new Date().toISOString()
      };

      // Create hash of service log data for verification
      const dataHash = Hash.sha256(JSON.stringify(logData));

      // Create PushDrop token for service log
      const pushdrop = new PushDrop(wallet);
      const customInstructions = {
        protocolID: [0, 'vehicle service log'] as WalletProtocol,
        keyID: Utils.toBase64(dataHash)
      };

      // Create locking script with FULL service log data embedded on-chain
      const lockingScript = await pushdrop.lock(
        [
          Utils.toArray(serviceType, 'utf8'),
          Utils.toArray(serviceDate, 'utf8'),
          Utils.toArray(mileage.toString(), 'utf8'),
          Utils.toArray(description, 'utf8'),
          Utils.toArray(cost === '' ? '0' : cost.toString(), 'utf8'),
          Utils.toArray(vin, 'utf8'),
          Utils.toArray(JSON.stringify(logData), 'utf8') // Full data as JSON
        ],
        customInstructions.protocolID,
        customInstructions.keyID,
        'self',
        true,
        true,
        'after'
      );

      // Create transaction output
      const outputs = [{
        lockingScript: lockingScript.toHex(),
        satoshis: 1,
        outputDescription: 'vehicle service log',
        customInstructions: JSON.stringify(customInstructions),
        basket: 'vehicle-service-logs'
      }];

      // Create action with wallet
      const res = await wallet.createAction({
        description: 'create service log for vehicle maintenance record',
        outputs,
        options: {
          randomizeOutputs: false
        }
      });

      // Broadcast transaction
      const tx = Transaction.fromAtomicBEEF(res.tx as number[]);
      const arc = await tx.broadcast(new ARC('https://arc.taal.com'));
      
      console.log('Service log created:', { txid: res.txid, arc });

      // Save to backend database
      const payload = {
        serviceType,
        serviceDate,
        mileage: Number(mileage),
        description,
        cost: cost === '' ? null : Number(cost),
        txid: res.txid,
        onchainAt: new Date().toISOString(),
        logHash: Utils.toBase64(dataHash)
      };

      const r = await fetch(`http://localhost:4001/api/vehicles/${vin}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (r.status === 201) {
        // Reset form
        setServiceType("");
        setServiceDate(new Date().toISOString().split('T')[0]);
        setMileage('');
        setDescription("");
        setCost('');
        setShowForm(false);
        onLogCreated();
      } else {
        const body = await r.json().catch(() => ({}));
        setError(body.error || 'Failed to create service log');
      }
    } catch (err: unknown) {
      console.error('Error creating service log:', err);
      setError((err as Error).message || 'Failed to create service log');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div style={{ marginTop: 16 }}>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
          disabled={!wallet}
        >
          + Add Service Log
        </button>
        {!wallet && <div className="muted" style={{ marginTop: 8 }}>Connect your wallet to add service logs</div>}
      </div>
    );
  }

  return (
    <section style={{ marginTop: 16, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Add Service Log</h3>
        <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: 12 }}>
          <label className="field">
            <span className="field-label">Service Type *</span>
            <select 
              className="field-input" 
              value={serviceType} 
              onChange={e => setServiceType(e.target.value)}
              required
            >
              <option value="">Select service type...</option>
              <option value="Oil Change">Oil Change</option>
              <option value="Tire Rotation">Tire Rotation</option>
              <option value="Brake Service">Brake Service</option>
              <option value="Transmission Service">Transmission Service</option>
              <option value="Engine Repair">Engine Repair</option>
              <option value="Battery Replacement">Battery Replacement</option>
              <option value="Air Filter Replacement">Air Filter Replacement</option>
              <option value="Wheel Alignment">Wheel Alignment</option>
              <option value="Inspection">Inspection</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label className="field">
            <span className="field-label">Service Date *</span>
            <input 
              className="field-input" 
              type="date" 
              value={serviceDate} 
              onChange={e => setServiceDate(e.target.value)}
              required 
            />
          </label>

          <label className="field">
            <span className="field-label">Mileage *</span>
            <input 
              className="field-input" 
              type="number" 
              value={mileage} 
              onChange={e => setMileage(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Odometer reading"
              required 
            />
          </label>

          <label className="field">
            <span className="field-label">Description *</span>
            <textarea 
              className="field-input" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Details of the service performed..."
              rows={3}
              required
              style={{ resize: 'vertical' }}
            />
          </label>

          <label className="field">
            <span className="field-label">Cost (optional)</span>
            <input 
              className="field-input" 
              type="number" 
              step="0.01"
              value={cost} 
              onChange={e => setCost(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Service cost"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={loading || !wallet}>
              {loading ? 'Creating on blockchain...' : 'Add Service Log'}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
