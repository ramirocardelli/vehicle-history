import { useEffect, useState } from 'react';
import type { Vehicle, ServiceLog } from './types';
import type { WalletClient } from '@bsv/sdk';
import AddServiceLog from './AddServiceLog';

type VehicleDetailProps = {
  vin: string;
  wallet?: WalletClient | null;
};

export default function VehicleDetail({ vin, wallet }: VehicleDetailProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadVehicle = () => {
    if (!vin) return;
    setLoading(true);
    fetch(`http://localhost:4001/api/vehicles/${vin}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => setVehicle(data))
      .catch(err => {
        console.error('Failed to load vehicle', err);
        setVehicle(null);
      })
      .finally(() => setLoading(false));
  };

  const loadServiceLogs = () => {
    if (!vin) return;
    setLogsLoading(true);
    fetch(`http://localhost:4001/api/vehicles/${vin}/logs`)
      .then(r => r.json())
      .then((data) => setServiceLogs(data))
      .catch(err => console.error('Failed to load service logs', err))
      .finally(() => setLogsLoading(false));
  };

  useEffect(() => {
    loadVehicle();
    loadServiceLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vin]);

  if (loading) return <div>Loading vehicle…</div>;
  if (!vehicle) return <div>Vehicle not found.</div>;

  return (
    <>
      <article className="card vehicle-detail">
        <h2 style={{ marginTop: 0 }}>{vehicle.make} {vehicle.model} — {vehicle.year}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><strong>VIN:</strong> <div className="vehicle-vin">{vehicle.vin}</div></div>
          <div>
            <strong>Token ID:</strong> 
            <div className="vehicle-vin">
              {vehicle.tokenId ? (
                <a 
                  href={`https://whatsonchain.com/tx/${vehicle.tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0ea5a4', textDecoration: 'underline' }}
                >
                  {vehicle.tokenId}
                </a>
              ) : (
                vehicle.tokenId
              )}
            </div>
          </div>
          <div><strong>Owner:</strong> <div className="muted">{vehicle.ownerAddress}</div></div>
          <div><strong>Current mileage:</strong> {vehicle.currentMileage ?? 'N/A'}</div>
        </div>
      </article>

      <section style={{ marginTop: 24 }}>
        <h3>Service History</h3>
        
        <AddServiceLog 
          vin={vin} 
          wallet={wallet || null} 
          onLogCreated={loadServiceLogs}
        />

        {logsLoading ? (
          <div style={{ marginTop: 16 }}>Loading service logs...</div>
        ) : serviceLogs.length === 0 ? (
          <div className="muted" style={{ marginTop: 16 }}>No service logs yet.</div>
        ) : (
          <div style={{ marginTop: 16 }}>
            {serviceLogs.map((log) => (
              <div key={log._id} className="card" style={{ marginBottom: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, marginBottom: 8 }}>{log.serviceType}</h4>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      <div><strong>Date:</strong> {new Date(log.serviceDate).toLocaleDateString()}</div>
                      <div><strong>Mileage:</strong> {log.mileage.toLocaleString()} miles</div>
                      {log.cost && <div><strong>Cost:</strong> ${log.cost.toFixed(2)}</div>}
                    </div>
                    <p style={{ marginTop: 8, marginBottom: 0 }}>{log.description}</p>
                  </div>
                  {log.txid && (
                    <a 
                      href={`https://whatsonchain.com/tx/${log.txid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                      style={{ fontSize: 12 }}
                    >
                      View on Chain
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
