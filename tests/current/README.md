# Current Architecture Test Suite

Run all tests with `npm test`. The suite deliberately uses mocked Prisma, authentication, cache, and external providers; it does not contact PostgreSQL, ImageBB, email services, or SSLCommerz.

The current coverage protects the architectural boundaries that changed during the development cutover:

- customer versus staff workspace isolation;
- dynamic staff permissions and Super Admin navigation;
- unified Food validation and trusted cart prices;
- cart ownership and staff rejection;
- open-store checkout;
- payment attempts, callback validation, retry preservation, and SSLCommerz public callback URLs.

Add new tests under `tests/current/`. Test active behavior only; do not recreate legacy route or product-model coverage.
