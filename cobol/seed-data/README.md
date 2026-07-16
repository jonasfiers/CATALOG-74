# Seed data

Starting state for the interactive demo — the same "Cabin weekend" cast
used everywhere else in this project. File names match the pipeline's
actual runtime file names exactly, so seeding is just copying these
into the data volume, no separate loader.

**Demo logins** (same password for all three, shown on the login screen):

| User | ID     | Password   |
|------|--------|------------|
| You  | 000001 | `demo1234` |
| Mila | 000002 | `demo1234` |
| Theo | 000003 | `demo1234` |

`USER-AUTH.DAT` holds real bcrypt hashes of `demo1234`, not placeholders
— generated once with `bcryptjs` and verified to actually check out
before being committed.

`BALANCE-MASTER.DAT` isn't hand-written — it's the real output of
running `EXPENSE-MASTER.DAT` and `SHARE-TRANS.DAT` through the actual
batch pipeline (`cobol/scripts/run-batch.sh`) once, so the demo starts
"warm" with correct balances already visible instead of an empty state
until the first nightly run:

- **You** paid €96.00, owes nothing → net **+€96.00**
- **Mila** owes €32.00, paid nothing → net **−€32.00**
- **Theo** owes €40.00, paid nothing → net **−€40.00**
