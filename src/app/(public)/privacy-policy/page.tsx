export default function PrivacyPolicyPage() {
  return (
    <section className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-10">
        <h1 className="text-4xl font-bold text-primary">Privacy Policy</h1>

        <p className="text-muted-foreground">
          Your privacy matters to us. Here{"'"}s how we handle your data.
        </p>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <ul className="list-disc ml-6 text-muted-foreground space-y-1">
              <li>Name, email, phone</li>
              <li>Order & payment details</li>
              <li>Device and usage data</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold">2. How We Use Data</h2>
            <ul className="list-disc ml-6 text-muted-foreground space-y-1">
              <li>Process orders</li>
              <li>Improve experience</li>
              <li>Send updates</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold">3. Data Protection</h2>
            <p className="text-muted-foreground">
              We use industry-standard security measures.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">4. Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your data. We may share with payment and delivery
              partners.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">5. Cookies</h2>
            <p className="text-muted-foreground">
              Used to improve experience and analyze usage.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <ul className="list-disc ml-6 text-muted-foreground space-y-1">
              <li>Access your data</li>
              <li>Request deletion</li>
              <li>Opt out of marketing</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold">7. Updates</h2>
            <p className="text-muted-foreground">
              Policy may be updated periodically.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Last updated: 2026</p>
      </div>
    </section>
  );
}
