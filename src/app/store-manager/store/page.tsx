import { getMyStore } from "@/features/store-manager/actions";
import { StoreClient } from "./StoreClient";

export default async function StoreManagerStorePage() {
  const result = await getMyStore();
  if ("error" in result) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Store</h1>
        <p className="text-muted-foreground">{result.error}</p>
      </div>
    );
  }

  return <StoreClient initialStore={result.store} />;
}
