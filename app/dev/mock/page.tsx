"use client";
import { useEffect, useState } from "react";

export default function DevicesPage() {
  const [devices, setDevices] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("i'm here");
    fetch("/api/devices")
      .then((res) => res.json())
      .then((data) => {
        setDevices(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!devices.length) return <p>No devices found.</p>;

  return (
    <ul>
      {devices.map((d) => (
        <li key={d.id}>{d.name}</li>
      ))}
    </ul>
  );
}
