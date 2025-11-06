import React, { useEffect, useState } from 'react';
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
    <article>
      <h2>{vehicle.make} {vehicle.model} — {vehicle.year}</h2>
      <div><strong>VIN:</strong> {vehicle.vin}</div>
      <div><strong>Token ID:</strong> {vehicle.tokenId}</div>
      <div><strong>Owner:</strong> {vehicle.ownerAddress}</div>
      <div><strong>Current mileage:</strong> {vehicle.currentMileage ?? 'N/A'}</div>
      <div style={{ marginTop: 12 }}>
        <strong>Metadata</strong>
        <pre style={{ background: '#fafafa', padding: 8 }}>{JSON.stringify(vehicle.metadata || {}, null, 2)}</pre>
      </div>
    </article>
  );
}
