export const runtime = "edge";

export default function LicensePage() {
  return (
    <section className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-10">
        <h1 className="text-4xl font-bold text-primary">License Agreement</h1>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">1. Usage Rights</h2>
            <p className="text-muted-foreground">
              You are granted a limited, non-exclusive license for personal use.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">2. Restrictions</h2>
            <ul className="list-disc ml-6 text-muted-foreground space-y-1">
              <li>No copying or redistribution</li>
              <li>No reverse engineering</li>
              <li>No commercial resale without permission</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold">3. Ownership</h2>
            <p className="text-muted-foreground">
              All rights remain with Chaatwala.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">4. Termination</h2>
            <p className="text-muted-foreground">
              Access may be revoked if terms are violated.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">5. Third-Party Services</h2>
            <p className="text-muted-foreground">
              Some features rely on third-party services with their own terms.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Last updated: 2026</p>
      </div>
    </section>
  );
}
