# CATALOG-74

Live at [catalog74.jonasfiers.eu](https://catalog74.jonasfiers.eu) — demo logins below.

[Splitty](https://splitty.jonasfiers.eu), sent back to 1974. Same idea — a balance isn't a field you keep updated, it's something you compute from the transactions underneath — rebuilt from scratch on the paradigm that would've been available before graph databases, live queries, or JSON existed: fixed-width flat files and nightly batch runs.

Splitty derives a balance by traversing a live graph on every request. CATALOG-74 derives the same balance the way a shop running COBOL on real iron would have: sort the day's transactions, run them through a control-break aggregation, merge the two results together, write the answer to a file. The balance you see is only ever as fresh as the last batch run — which is the entire point. Add an expense and the number on screen does **not** move. It's frozen until someone (or something, nightly) runs the batch.

## The two systems, side by side

| | [Splitty](https://splitty.jonasfiers.eu) | CATALOG-74 |
|---|---|---|
| Derivation | Cypher traversal, on every read | Sort → control-break → matched merge, on a schedule |
| Freshness | Always current | As of the last batch run |
| Storage | Neo4j graph | Fixed-width flat files (`PIC` clauses, byte offsets) |
| "Join" | `MATCH` pattern | Classic matched-merge algorithm |
| "GROUP BY SUM()" | Cypher aggregation | Manual control-break loop |

Neither is wrong. They're the same modeling idea — *a balance is computed, not incrementally maintained* — expressed in two paradigms forty years apart. Splitty computes it fresh on every read and never stores the result; CATALOG-74 computes it on a schedule and does store the result, which is exactly why it's only ever as fresh as the last batch run instead of always current. Splitty exists because Neo4j made the "compute, don't maintain" idea feel natural. CATALOG-74 exists to show the same idea was already possible decades earlier, just with a lot more manual bookkeeping and an overnight wait built into the design.

## How the batch pipeline works

Three real COBOL programs (compiled with GnuCOBOL), reading and writing files whose layouts are defined once in `cobol/copybooks/*.cpy` and shared across every program that touches them — the closest COBOL gets to a schema:

```
SHARE-TRANS.DAT ──sort──▶ CALC-OWED  ──▶ AMOUNT-OWED.DAT ─┐
                                                            ├─▶ MERGE-BALANCE ──▶ BALANCE-MASTER.DAT
EXPENSE-MASTER.DAT ─sort──▶ CALC-PAID ──▶ AMOUNT-PAID.DAT ─┘
```

- **`CALC-OWED`** / **`CALC-PAID`** — control-break aggregation. Both inputs are pre-sorted by group+person; each program walks its file once, watching for the sort key to change, and emits a running total the instant it does. This is what `SUM() ... GROUP BY` compiles down to when there's no query planner to do it for you.
- **`MERGE-BALANCE`** — a classic matched merge of the two aggregate files (both still sorted by the same key): advance whichever cursor is behind, and when the keys match, net the two amounts into `NET-BALANCE`. This is what a `JOIN` looks like without a database underneath it.
- **`cobol/scripts/run-batch.sh`** actually runs this sequence (`sort` twice, then the three binaries). `cobol/jcl/RUN-BATCH.jcl` documents the identical sequence in real JCL — flavor text, since there's no mainframe JES here to submit it to.

Every field is a fixed byte range (`PIC 9(6)`, `PIC X(30)`, ...) — `api-cobol/lib/specs.js` mirrors those offsets exactly so the Node adapter can read and write the same files the COBOL programs do, with nothing in between.

## Architecture

```
web/            React frontend (forked from Splitty, re-themed, trimmed to
                what this backend actually supports — no categories,
                passkeys, or multi-currency; those never existed here)
api-cobol/      Express adapter — reads/writes the flat files directly,
                JWT auth over USER-AUTH-REC, shells out to run-batch.sh
                on demand or on a schedule
cobol/
  copybooks/    Shared record layouts (USER-REC, EXPENSE-REC, ...)
  programs/     CALC-OWED, CALC-PAID, MERGE-BALANCE
  scripts/      run-batch.sh — the orchestration that actually executes
  jcl/          RUN-BATCH.jcl — the same sequence in real JCL, unexecuted
  seed-data/    Demo dataset, BALANCE-MASTER.DAT pre-computed by running
                the real pipeline once so the demo starts "warm"
```

The Docker data volume is the "DASD" — flat files that persist across restarts, seeded from `cobol/seed-data` the first time the container starts empty.

## Running it

```bash
cp .env.example .env   # set JWT_SECRET (openssl rand -hex 32)
docker compose up -d --build
```

Brings up two containers: `api` (the Express adapter plus the compiled COBOL binaries it shells out to) and `web` (Nginx serving the built frontend, proxying `/api`). Nothing is exposed to the internet beyond port 80 — a host-level Cloudflare Tunnel, reverse proxy, etc. is left to you, same as Splitty.

Demo logins (see [`cobol/seed-data/README.md`](cobol/seed-data/README.md)): `you@catalog74.demo` / `demo1234`, plus Mila and Theo.

**To see the point of the whole project:** add an expense, watch the balance *not* change, click "Run batch now," watch it change. In production that same run happens on its own every `BATCH_INTERVAL_MS` (24h by default) — the button just makes it visible without an overnight wait.

### Local dev, no Docker

```bash
npm install && npm install --prefix api-cobol
JWT_SECRET=dev-secret npm run dev:api   # api on :3000
npm run dev:web                          # web on :5173
```

`api-cobol` shells out to `cobol/scripts/run-batch.sh`, which needs GnuCOBOL's `cobc` on `PATH` (`brew install gnucobol` / `apt install gnucobol4`) and the three programs compiled once: `for f in cobol/programs/*.cbl; do cobc -x -free -I cobol/copybooks -o "bin/$(basename "$f" .cbl | tr A-Z a-z)" "$f"; done`, then point `BIN_DIR` at that `bin/` folder.

The web dev server proxies `/api` to `http://api:3000` by default — override with `VITE_API_TARGET` if the API isn't running at that address (e.g. `VITE_API_TARGET=http://localhost:3000`).

### Docker-free (LXC / bare metal)

[`deploy/provision-lxc.sh`](deploy/provision-lxc.sh) sets up the same stack without a Docker daemon in between — Node 20, nginx, and GnuCOBOL installed straight on a Debian/Ubuntu box, systemd running the API, nginx doing the same routing `web/nginx.conf` does in the container build. Useful for an LXC container where running Docker-in-Docker is more overhead than it's worth.

```bash
curl -fsSL https://raw.githubusercontent.com/jonasfiers/CATALOG-74/main/deploy/provision-lxc.sh | bash
```

Reruns are safe — it pulls the latest `main` if the checkout already exists. Override `REPO_URL`, `JWT_SECRET`, `BATCH_INTERVAL_MS`, etc. via environment variables; see the script header for the full list. This is how the live demo above is actually deployed.

## License

MIT — see [LICENSE](LICENSE).

---

Built by [Jonas Fiers](https://www.jonasfiers.eu) — software engineer in Ghent, previously in insurance, usually somewhere between legacy systems and the paradigms that replaced them.
