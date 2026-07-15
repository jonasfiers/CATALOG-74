# Splitty

Splitwise, but the balances are a graph. A self-hosted expense-splitting app where debts aren't stored directly between people — they're derived from `PAID` and `OWED_BY` relationships on `Expense` nodes in Neo4j.

Built mostly as an excuse to get properly hands-on with graph data modeling.

## How it's modeled

Instead of a `Person -[:OWES]-> Person` edge, every expense is its own node:

```cypher
MATCH (payer:User)-[:PAID]->(e:Expense)-[o:OWED_BY]->(u:User)
RETURN payer, e, o, u
```

Balances between two people are summed on the fly from every `PAID`/`OWED_BY` pair across their shared groups. Settlements aren't a separate concept — they're just another `Expense` node (`isSettlement: true`).

## Features

- Groups with multi-currency support and daily exchange-rate snapshots
- Expenses with hierarchical categories, arbitrary per-person shares, and settlements
- Balance transfers between groups
- Passkey (WebAuthn) and password login
- Push notifications for group activity
- Installable PWA with an offline-friendly service worker
- Animated cat avatar with an idle / success / fail state machine

## Stack

- **API** — Node.js, Express, Neo4j (`neo4j-driver` + APOC), JWT, WebAuthn, `web-push`, Nodemailer
- **Web** — React, Vite, React Router, Recharts
- **Infra** — Docker Compose, Cloudflare Tunnel, Nginx

## Running it

### Full stack (Docker)

```bash
cp .env.example .env   # fill in the values
docker compose up -d
```

### Local dev

```bash
docker compose -f compose.dev.yaml up -d   # Neo4j only, exposed on bolt://localhost:7688
cp .env.example .env                        # set NEO4J_URI=bolt://localhost:7688 for local dev
npm install
npm run dev                                 # api on :3000, web on :5173
```

The web dev server proxies `/api` to the API — override the target with `VITE_API_TARGET` if it's not running at `http://api:3000`.

## License

MIT — see [LICENSE](LICENSE).
