import { PushDrop, WalletClient, Hash, Utils, Transaction, ARC } from "@bsv/sdk";
import type { WalletProtocol } from "@bsv/sdk";
import { useState } from "react";

export default function CreateVehicle({ wallet, ownerAddress, onCreated }: { wallet: WalletClient | null, ownerAddress: string | null, onCreated: (vin: string) => void }) {
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | ''>('');
  const [mileage, setMileage] = useState<number | ''>('');
  const [color, setColor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!wallet) return setError('You must be connected to create a token');
    if (!vin || !make || !model || !year) return setError('Please fill required fields');

    try {
      setLoading(true);
      const exists = await fetch(`http://localhost:4001/api/vehicles/${vin}`);
      if (exists.ok) {
        setError('VIN already in use');
        setLoading(false);
        return;
      }

      // Create vehicle data object
      const vehicleData = {
        vin,
        make,
        model,
        year: Number(year),
        currentMileage: mileage === '' ? null : Number(mileage),
        metadata: { color },
        ownerAddress,
        timestamp: new Date().toISOString()
      };

      // Create hash of vehicle data for blockchain
      const dataHash = Hash.sha256(JSON.stringify(vehicleData));
      const doubleHash = Hash.sha256(dataHash);

      // Create PushDrop token
      const pushdrop = new PushDrop(wallet);
      const customInstructions = {
        protocolID: [0, 'vehicle history'] as WalletProtocol,
        keyID: Utils.toBase64(dataHash)
      };

      // Create locking script for the token
      const lockingScript = await pushdrop.lock(
        [Utils.toArray(vin, 'utf8'), doubleHash],
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
        outputDescription: 'vehicle history token',
        customInstructions: JSON.stringify(customInstructions),
        basket: 'vehicle-history'
      }];

      // Create action with wallet
      const res = await wallet.createAction({
        description: 'create vehicle token for blockchain-based service history',
        outputs,
        options: {
          randomizeOutputs: false
        }
      });

      // Broadcast transaction
      const tx = Transaction.fromAtomicBEEF(res.tx as number[]);
      const arc = await tx.broadcast(new ARC('https://arc.taal.com'));
      
      console.log('Token created:', { txid: res.txid, arc });

      // Save to backend database
      const payload = {
        vin,
        make,
        model,
        year: Number(year),
        currentMileage: mileage === '' ? null : Number(mileage),
        ownerAddress,
        metadata: { color },
        tokenId: res.txid,
        onchainTx: res.txid,
        onchainAt: new Date().toISOString(),
        vehicleHash: Utils.toBase64(dataHash)
      };

      const r = await fetch('http://localhost:4001/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (r.status === 201) {
        onCreated(vin);
      } else if (r.status === 409) {
        setError('VIN already exists');
      } else {
        const body = await r.json().catch(() => ({}));
        setError(body.error || 'Failed to create vehicle');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="create-vehicle">
      <h2>Create Vehicle Token</h2>
      {!ownerAddress ? <div className="muted">You must connect your wallet to create tokens.</div> : null}

      <form onSubmit={handleSubmit} className="vehicle-form">
        <div className="form-grid">
          <div className="form-fields">
            <label className="field">
              <span className="field-label">VIN *</span>
              <input className="field-input" value={vin} onChange={e => setVin(e.target.value.trim())} required />
            </label>

            <label className="field">
              <span className="field-label">Make *</span>
              <input className="field-input" value={make} onChange={e => setMake(e.target.value)} required />
            </label>

            <label className="field">
              <span className="field-label">Model *</span>
              <input className="field-input" value={model} onChange={e => setModel(e.target.value)} required />
            </label>

            <label className="field">
              <span className="field-label">Year *</span>
              <input className="field-input" type="number" value={year} onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))} required />
            </label>

            <label className="field">
              <span className="field-label">Current mileage</span>
              <input className="field-input" type="number" value={mileage} onChange={e => setMileage(e.target.value === '' ? '' : Number(e.target.value))} />
            </label>

            <label className="field">
              <span className="field-label">Color</span>
              <input className="field-input" value={color} onChange={e => setColor(e.target.value)} />
            </label>

            {error ? <div className="form-error">{error}</div> : null}

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={loading || !ownerAddress}>{loading ? 'Creating…' : 'Create Token'}</button>
            </div>
          </div>

          <aside className="token-preview">
            <div className="preview-top">
              <div className="preview-title">Token Preview</div>
              <div className="preview-sub">Live preview of the token metadata</div>
            </div>

            <div className="preview-body">
              <div className="preview-row"><strong>VIN</strong><span className="mono">{vin || '—'}</span></div>
              <div className="preview-row"><strong>Make</strong><span>{make || '—'}</span></div>
              <div className="preview-row"><strong>Model</strong><span>{model || '—'}</span></div>
              <div className="preview-row"><strong>Year</strong><span>{year || '—'}</span></div>
              <div className="preview-row"><strong>Color</strong><span>{color || '—'}</span></div>
              <div className="preview-row"><strong>Owner</strong><span className="mono small">{ownerAddress ? ownerAddress : 'Not connected'}</span></div>
            </div>

            <div className="preview-footer">After creation the tokenId will appear here.</div>
          </aside>
        </div>
      </form>
    </section>
  );
}
