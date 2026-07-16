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
until the first nightly run.

`SHARE-TRANS.DAT` has three rows for the one €96 "Cabin weekend"
expense, not two — Mila owes €32, Theo owes €40, **and You owe
yourself €24**, your own share of what you paid. A live PAID/OWED_BY
graph traversal derives that figure on the fly and never stores it;
CALC-OWED can't (it's a one-pass sum over whatever's actually in the
file), so the write path has to hand it a real row instead. Leave it
out and the ledger stops summing to zero — every payer's balance
silently overstates their credit by exactly their own share of
everything they've ever paid for.

- **You** paid €96.00, own share €24.00 → net **+€72.00**
- **Mila** owes €32.00, paid nothing → net **−€32.00**
- **Theo** owes €40.00, paid nothing → net **−€40.00**
