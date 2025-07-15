"use client";

import { useEffect, useState } from "react";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">My Orders</h1>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.id} className="mb-4 p-4 border rounded">
              <p>Order Number: <strong>{order.orderNumber}</strong></p>
              <p>Status: {order.status}</p>
              <p>Total: {order.invoiceTotal} BHD</p>
              <p>Pickup Time: {order.pickupTime}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
