export default function TermsAndConditionsPage() {
  return (
    <section className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-10">
        <h1 className="text-4xl font-bold text-primary">Terms & Conditions</h1>

        <p className="text-muted-foreground">
          Welcome to Chaatwala. By accessing or using our platform, you agree to
          the following terms.
        </p>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">1. Use of Service</h2>
            <p className="text-muted-foreground">
              You agree to use our platform only for lawful purposes and not
              misuse the service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">2. Account Responsibility</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your
              account.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">3. Orders & Payments</h2>
            <ul className="list-disc ml-6 text-muted-foreground space-y-1">
              <li>Orders are subject to availability</li>
              <li>Prices may change without notice</li>
              <li>Payment must be completed before processing</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              4. Cancellations & Refunds
            </h2>
            <p className="text-muted-foreground">
              Orders can be canceled within a limited time. Refunds depend on
              eligibility.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content belongs to Chaatwala and cannot be reused without
              permission.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              6. Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              We are not responsible for delays, interruptions, or indirect
              damages.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">7. Changes</h2>
            <p className="text-muted-foreground">
              Terms may be updated anytime. Continued use means acceptance.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Last updated: 2026</p>
      </div>
    </section>
  );
}
