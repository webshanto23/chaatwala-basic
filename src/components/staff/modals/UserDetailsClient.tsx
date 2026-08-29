"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  addresses: {
    id: string;
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    postalCode: string;
    country: string | null;
    isDefault: boolean;
  }[];
  defaultAddress?: {
    id: string;
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    postalCode: string;
    country: string | null;
  } | null;
};

const userCache = new Map<string, User>();

export default function UserDetailsClient({ userId }: { userId: string }) {
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (userCache.has(userId)) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setData(userCache.get(userId)!);
          setLoading(false);
        }
      });
      return;
    }

    fetch(`/api/staff/users/${userId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load user");
        }
        return res.json();
      })
      .then((body) => {
        if (!cancelled) {
          userCache.set(userId, body.user);
          setData(body.user);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (error || !data) {
    return <p className="text-muted-foreground">{error ?? "User not found."}</p>;
  }

  const defaultAddress = data.defaultAddress ?? data.addresses.find((a) => a.isDefault) ?? data.addresses[0];

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-muted-foreground">Name</p>
          <p className="font-medium">{data.name ?? "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Email</p>
          <p className="font-medium">{data.email ?? "-"}</p>
        </div>
      </div>

      {defaultAddress && (
        <div className="space-y-1">
          <p className="text-muted-foreground">Address</p>
          <p className="font-medium">
            {defaultAddress.fullName}
            <br />
            {defaultAddress.line1}
            {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ""}
            <br />
            {defaultAddress.city}, {defaultAddress.postalCode}
            <br />
            {defaultAddress.country}
          </p>
          <p className="text-muted-foreground">Phone: {defaultAddress.phone}</p>
        </div>
      )}

      {data.addresses.length > 1 && (
        <div className="space-y-1">
          <p className="text-muted-foreground font-medium">Other Addresses</p>
          {data.addresses.filter((a) => !a.isDefault).map((addr) => (
            <p key={addr.id} className="text-xs text-muted-foreground">
              {addr.fullName}, {addr.line1}, {addr.city}, {addr.postalCode}, {addr.country}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
