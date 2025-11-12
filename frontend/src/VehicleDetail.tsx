import { useEffect, useState } from 'react';
import type { Vehicle, ServiceLog } from './types';
import type { WalletClient } from '@bsv/sdk';
import AddServiceLog from './AddServiceLog';
import { generateServiceHistoryPDF } from './exportPDF';

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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
          gap: window.innerWidth < 768 ? 16 : 8
        }}>
          <div>
            <strong>VIN:</strong> 
            <div className="vehicle-vin" style={{ wordBreak: 'break-all' }}>{vehicle.vin}</div>
          </div>
          <div>
            <strong>Token ID:</strong> 
            <div className="vehicle-vin" style={{ wordBreak: 'break-all' }}>
                {vehicle._id}
            </div>
          </div>
          <div>
            <strong>Owner:</strong> 
            <div className="muted" style={{ wordBreak: 'break-all' }}>{vehicle.ownerAddress}</div>
          </div>
          <div><strong>Current mileage:</strong> {vehicle.currentMileage ?? 'N/A'}</div>
        </div>
      </article>

      <section style={{ marginTop: 24 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16,
          flexWrap: window.innerWidth < 768 ? 'wrap' : 'nowrap',
          gap: 12
        }}>
          <h3 style={{ margin: 0 }}>Service History</h3>
          <button 
            className="btn btn-ghost" 
            onClick={() => generateServiceHistoryPDF(vehicle, serviceLogs)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Export PDF
          </button>
        </div>
        
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
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  flexWrap: window.innerWidth < 768 ? 'wrap' : 'nowrap',
                  gap: 12
                }}>
                  <div style={{ flex: window.innerWidth < 768 ? '1 1 100%' : 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, marginBottom: 8 }}>{log.serviceType}</h4>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      <div><strong>Date:</strong> {new Date(log.serviceDate).toLocaleDateString()}</div>
                      <div><strong>Mileage:</strong> {log.mileage.toLocaleString()} miles</div>
                      {log.cost && <div><strong>Cost:</strong> ${log.cost.toFixed(2)}</div>}
                    </div>
                    <p style={{ marginTop: 8, marginBottom: 0, wordWrap: 'break-word' }}>
                      {log.description}
                    </p>
                  </div>
                  {log.txid && (
                    <a 
                      href={`https://whatsonchain.com/tx/${log.txid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                      style={{ fontSize: 12, flexShrink: 0 }}
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
