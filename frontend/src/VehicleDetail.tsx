import { useEffect, useState } from 'react';
import type { Vehicle } from './types';

type VehicleDetailProps = {
  vin: string;
};

export default function VehicleDetail({ vin }: VehicleDetailProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
  }, [vin]);

  if (loading) return <div>Loading vehicle…</div>;
  if (!vehicle) return <div>Vehicle not found.</div>;

  return (
    <article className="card vehicle-detail">
      <h2 style={{ marginTop: 0 }}>{vehicle.make} {vehicle.model} — {vehicle.year}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><strong>VIN:</strong> <div className="vehicle-vin">{vehicle.vin}</div></div>
        <div><strong>Token ID:</strong> <div className="vehicle-vin">{vehicle.tokenId}</div></div>
        <div><strong>Owner:</strong> <div className="muted">{vehicle.ownerAddress}</div></div>
        <div><strong>Current mileage:</strong> {vehicle.currentMileage ?? 'N/A'}</div>
      </div>
      <div style={{ marginTop: 12 }}>
        <strong>Metadata</strong>
        <pre className="vehicle-detail">{JSON.stringify(vehicle.metadata || {}, null, 2)}</pre>
      </div>
    </article>
  );
}
