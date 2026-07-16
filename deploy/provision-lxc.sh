#!/bin/bash
# Docker-free provisioning for a Debian/Ubuntu LXC container.
# Installs Node 20, nginx and GnuCOBOL directly on the container,
# compiles the three COBOL batch programs, builds the web frontend,
# and wires up systemd + nginx to reproduce what compose.yaml does
# with two containers -- but as one process tree with no Docker
# daemon in between.
#
# Run as root inside a fresh LXC (tested against Debian 12 / Ubuntu
# 22.04+ containers). Re-running is safe: each step is idempotent.
#
# Override any of these via environment before running, e.g.:
#   REPO_URL=git@github.com:you/CATALOG-74.git JWT_SECRET=... ./provision-lxc.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/jonasfiers/CATALOG-74.git}"
BRANCH="${BRANCH:-main}"
APP_USER="${APP_USER:-catalog74}"
APP_DIR="${APP_DIR:-/opt/catalog74}"
DATA_DIR="${DATA_DIR:-/var/lib/catalog74}"
ENV_FILE="${ENV_FILE:-/etc/catalog74.env}"
API_PORT="${API_PORT:-3000}"
BATCH_INTERVAL_MS="${BATCH_INTERVAL_MS:-86400000}"
JWT_SECRET="${JWT_SECRET:-}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this as root." >&2
  exit 1
fi

echo "==> Installing base packages (nginx, GnuCOBOL, build tools, git)"
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg git nginx gnucobol4 build-essential

if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  echo "==> Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Creating service user '$APP_USER'"
id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"

echo "==> Fetching source into $APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

echo "==> Compiling COBOL batch programs"
mkdir -p "$APP_DIR/bin"
for f in "$APP_DIR"/cobol/programs/*.cbl; do
  name="$(basename "$f" .cbl)"
  lower="$(echo "$name" | tr '[:upper:]' '[:lower:]')"
  cobc -x -free -I "$APP_DIR/cobol/copybooks" -o "$APP_DIR/bin/$lower" "$f"
done

echo "==> Installing API dependencies"
(cd "$APP_DIR/api-cobol" && npm ci --omit=dev)

echo "==> Building web frontend"
(cd "$APP_DIR/web" && npm ci && npm run build)

echo "==> Seeding data directory"
mkdir -p "$DATA_DIR"
if [ -z "$(ls -A "$DATA_DIR" 2>/dev/null)" ]; then
  cp -r "$APP_DIR"/cobol/seed-data/. "$DATA_DIR"/
fi
chown -R "$APP_USER":"$APP_USER" "$APP_DIR" "$DATA_DIR"

echo "==> Writing $ENV_FILE"
if [ ! -f "$ENV_FILE" ]; then
  if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET="$(openssl rand -hex 32)"
    echo "    generated a new JWT_SECRET (saved to $ENV_FILE)"
  fi
  cat > "$ENV_FILE" <<EOF
JWT_SECRET=$JWT_SECRET
BATCH_INTERVAL_MS=$BATCH_INTERVAL_MS
API_PORT=$API_PORT
DATA_DIR=$DATA_DIR
BIN_DIR=$APP_DIR/bin
BATCH_SCRIPT=$APP_DIR/cobol/scripts/run-batch.sh
EOF
  chmod 600 "$ENV_FILE"
  chown "$APP_USER":"$APP_USER" "$ENV_FILE"
else
  echo "    $ENV_FILE already exists, leaving it as-is"
fi

echo "==> Writing systemd unit"
cat > /etc/systemd/system/catalog74-api.service <<EOF
[Unit]
Description=CATALOG-74 API (Node adapter + COBOL batch)
After=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/api-cobol
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=2
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=$DATA_DIR
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF

echo "==> Writing nginx site"
cat > /etc/nginx/sites-available/catalog74 <<EOF
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    listen 80 default_server;
    server_name _;
    root $APP_DIR/web/dist;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://127.0.0.1:$API_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location = /index.html {
        add_header Cache-Control "no-cache" always;
    }

    location ~* ^/(sw\.js|registerSW\.js)\$ {
        try_files \$uri =404;
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
        add_header CDN-Cache-Control "no-store" always;
    }

    location = /manifest.webmanifest {
        default_type application/manifest+json;
        try_files \$uri =404;
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
        add_header CDN-Cache-Control "no-store" always;
    }

    location ~* ^/assets/.*\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|js|css)\$ {
        try_files \$uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|js|css)\$ {
        try_files \$uri =404;
        add_header Cache-Control "public, max-age=604800" always;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
ln -sf /etc/nginx/sites-available/catalog74 /etc/nginx/sites-enabled/catalog74
rm -f /etc/nginx/sites-enabled/default
nginx -t

echo "==> Starting services"
systemctl daemon-reload
systemctl enable --now catalog74-api
systemctl restart nginx

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp
fi

echo
echo "Done. Web: http://<lxc-ip>/   API (local only): http://127.0.0.1:$API_PORT"
echo "Logs: journalctl -u catalog74-api -f"
echo "Secrets: $ENV_FILE (mode 600, owned by $APP_USER)"
