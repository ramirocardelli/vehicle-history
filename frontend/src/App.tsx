"use client";

import { useState, useEffect } from "react";
import { WalletClient, PublicKey } from "@bsv/sdk";
import VehicleDetail from "./VehicleDetail";
import type { Vehicle } from "./types";

// Minimal types — adjust imports to match the BSV wallet library you use.
type WalletSession = {
  // New session shape stores both the address and the identity public key.
  address?: string; // Bitcoin address (preferred)
  publicKey?: string; // identity public key string
  timestamp: number;
};

const WALLET_SESSION_KEY = "wallet_session";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletClient | null>(null);

  useEffect(() => {
    // Restore session if present
    try {
      const raw = localStorage.getItem(WALLET_SESSION_KEY);
      if (raw) {
        const session: WalletSession = JSON.parse(raw);
        // Prefer the explicit address field if present
        if (session?.address) {
          setWalletAddress(session.address);
          setIsWalletConnected(true);
        } else if (session?.publicKey) {
          // Older/previous sessions or fallback may have stored the public key.
          // Convert it to a Bitcoin address for display.
          try {
            const pk = PublicKey.fromString(session.publicKey);
            const addr = pk.toAddress().toString();
            setWalletAddress(addr);
            setIsWalletConnected(true);
          } catch (err) {
            console.error("Failed to convert stored publicKey to address:", err);
          }
        }
      }
    } catch (e) {
      // ignore malformed session
      console.error("Failed to restore wallet session:", e);
    }
  }, []);

  const handleConnectWallet = async () => {
    setIsLoading(true);
    try {
      // Using WalletClient and PublicKey imported from @bsv/sdk

      const walletClient = new WalletClient();
      const authenticated = await walletClient.isAuthenticated();

      if (authenticated) {
        // Get the wallet's identity public key
        const result = await walletClient.getPublicKey({ identityKey: true });
        const publicKey = PublicKey.fromString(result.publicKey);

        // Convert public key to Bitcoin address
        const address = publicKey.toAddress().toString();
        console.log("Public Key:", publicKey.toString());
        console.log("Bitcoin Address:", address);

        setWallet(walletClient);
        setWalletAddress(address); // Use Bitcoin address instead of public key
        setIsWalletConnected(true);

        // Save session to localStorage
        const session: WalletSession = {
          // store both so we can restore reliably
          address,
          publicKey: publicKey.toString(),
          timestamp: Date.now(),
        };
        localStorage.setItem(WALLET_SESSION_KEY, JSON.stringify(session));
      } else {
        throw new Error(
          "Wallet is not authenticated. Please authenticate in BSV Desktop first."
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
      console.error("Failed to connect to BSV Desktop wallet:", err, errorMessage);
      alert(
        "Please download and open BSV Desktop wallet to continue. Visit https://bitcoinassociation.net/bsv-desktop/ to download."
      );
      setIsWalletConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maybe: any = wallet;
      if (maybe?.disconnect && typeof maybe.disconnect === "function") {
        await maybe.disconnect();
      } else if (maybe?.logout && typeof maybe.logout === "function") {
        await maybe.logout();
      }
    } catch (e) {
      console.warn("Error while disconnecting wallet:", e);
    }
    localStorage.removeItem(WALLET_SESSION_KEY);
    setWallet(null);
    setWalletAddress(null);
    setIsWalletConnected(false);
    setIsLoading(false);
  };

  // Simple client-side router: if path starts with /vehicle/:vin show detail
  const [route, setRoute] = useState<string>(window.location.pathname);

  // Listen to popstate so back/forward work
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // helper to navigate
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  return (
    <>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          borderBottom: "1px solid #eee",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600 }}>Vehicle History</div>
        <div>
          {!isWalletConnected ? (
            <button
              onClick={handleConnectWallet}
              disabled={isLoading}
              style={{ padding: "8px 16px", fontSize: 14 }}
            >
              {isLoading ? "Connecting…" : "Connect BSV Desktop"}
            </button>
          ) : (
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              style={{ padding: "8px 16px", fontSize: 14 }}
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Vehicle History — Sign in with BSV Desktop</h1>

        <p>
          Use your BSV Desktop wallet to authenticate. This page will attempt to
          connect to a local BSV Desktop Wallet Client API.
        </p>

        {route.startsWith('/vehicle/') ? (
          <VehicleDetail vin={route.replace('/vehicle/', '')} />
        ) : (
          <VehiclesList onOpen={(vin: string) => navigate(`/vehicle/${vin}`)} />
        )}

        {isWalletConnected && walletAddress ? (
          <div style={{ marginTop: 20 }}>
            <strong>Connected address:</strong>
            <div>{walletAddress}</div>
          </div>
        ) : null}

        {!isWalletConnected && !isLoading ? (
          <div style={{ marginTop: 16, color: "#666" }}>
            Not connected — click the button to open BSV Desktop and authenticate.
          </div>
        ) : null}
      </main>
    </>
  );
}

function VehiclesList({ onOpen }: { onOpen: (vin: string) => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:4001/api/vehicles')
      .then(r => r.json())
      .then((data) => setVehicles(data))
      .catch(err => console.error('Failed to load vehicles', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Available Vehicles</h2>
      {loading ? <div>Loading…</div> : null}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {vehicles.map(v => (
          <li key={v.vin} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{v.make} {v.model} ({v.year})</div>
                <div style={{ color: '#666' }}>{v.vin}</div>
              </div>
              <div>
                <button onClick={() => onOpen(v.vin)}>View</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// VehicleDetail moved to its own file (frontend/src/VehicleDetail.tsx)
