"use client";

import { useEffect, useState } from "react";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    fetch("/api/addresses")
      .then((res) => res.json())
      .then((data: any) => setAddresses(data));
  }, []);

  const addAddress = async () => {
    await fetch("/api/addresses", {
      method: "POST",
      body: JSON.stringify({ address: newAddress }),
    });
    setNewAddress("");
    window.location.reload();
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Addresses</h1>

      <ul className="mb-4">
        {addresses.map((a) => (
          <li key={a.id}>{a.address}</li>
        ))}
      </ul>

      <input
        type="text"
        placeholder="New Address"
        value={newAddress}
        onChange={(e) => setNewAddress(e.target.value)}
        className="border p-2 mr-2"
      />
      <button onClick={addAddress} className="bg-blue-600 text-white px-4 py-2">Add Address</button>
    </div>
  );
}
