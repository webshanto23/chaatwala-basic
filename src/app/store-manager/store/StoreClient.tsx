"use client";

type Store = {
  id: string;
  name: string;
  phone: string;
  address: string;
  imageUrl: string | null;
};

export function StoreClient({ initialStore }: { initialStore: Store }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Store</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          {initialStore.imageUrl ? (
            <img src={initialStore.imageUrl} alt={initialStore.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No Image</div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Store Name</p>
            <p className="text-lg font-medium">{initialStore.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone Number</p>
            <p className="text-lg font-medium">{initialStore.phone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="text-lg font-medium">{initialStore.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
