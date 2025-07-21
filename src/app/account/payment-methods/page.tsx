"use client";

import React, { useState, useEffect } from "react";

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [newMethod, setNewMethod] = useState("");

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((res) => res.json())
      .then(setMethods);
  }, []);

  const addMethod = async () => {
    if (!newMethod) return;

    const res = await fetch("/api/payment-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ methodName: newMethod }),
    });

    const added = await res.json();
    setMethods((prev) => [...prev, added]);
    setNewMethod("");
  };

  const deleteMethod = async (id) => {
    await fetch("/api/payment-methods", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    setMethods((prev) => prev.filter((pm) => pm.id !== id));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">My Payment Methods</h1>
      <p className="mb-4">You can add your payment methods here. (Currently no real payments connected)</p>

      <div className="space-y-2 mb-4">
        {methods.map((method) => (
          <div key={method.id} className="flex justify-between bg-gray-100 p-2 rounded">
            <span>{method.methodName}</span>
            <button onClick={() => deleteMethod(method.id)} className="text-red-500">Delete</button>
          </div>
        ))}
      </div>

      <div className="space-x-2">
        <input
          type="text"
          placeholder="Card / Payment Method Name"
          value={newMethod}
          onChange={(e) => setNewMethod(e.target.value)}
          className="border px-3 py-1"
        />
        <button onClick={addMethod} className="bg-blue-500 text-white px-4 py-1 rounded">Add</button>
      </div>
    </div>
  );
}
