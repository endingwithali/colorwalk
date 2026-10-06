# Color Walk

Color Walk shows one universal color of the day. The frontend is a Vite/React
service, the backend is a Go API service, and Postgres stores the selected
colors.

The backend is authoritative. If the frontend cannot load today's universal
color from the backend, it generates a local fallback color, stores that fallback
in browser localStorage, and shows a warning.

## Project Layout

```text
colorwalk/
  backend/    Go API using net/http, pgxpool, and Postgres
  frontend/   Vite React app
  docs/       project notes
```

## Requirements

- Node.js 20 LTS or 22 LTS
- npm
- Go 1.23+
- Postgres 15+

## Database Schema

The `daily_colors` table has two columns:

- `color_hex TEXT`
- `date TIMESTAMPTZ`

The seed data includes:

- `#FFC0CB` for `2000-01-01`
- `#4AB7D8` for `2026-10-06`

The service treats the universal color day as a UTC calendar day.

## Local Setup

Create a local Postgres database and user:

```sh
createdb colorwalk
psql colorwalk
```

Inside `psql`, run:

```sql
CREATE USER colorwalk WITH PASSWORD 'colorwalk_dev_password';
GRANT ALL PRIVILEGES ON DATABASE colorwalk TO colorwalk;
\c colorwalk
GRANT USAGE, CREATE ON SCHEMA public TO colorwalk;
```

Apply migrations:

```sh
psql "postgres://colorwalk:colorwalk_dev_password@127.0.0.1:5432/colorwalk?sslmode=disable" \
  -f backend/migrations/001_create_daily_colors.sql

psql "postgres://colorwalk:colorwalk_dev_password@127.0.0.1:5432/colorwalk?sslmode=disable" \
  -f backend/migrations/002_seed_daily_colors.sql
```

Create local environment files from the examples:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Start the backend:

```sh
cd backend
set -a
. ./.env
set +a
go run ./cmd/api
```

In another terminal, start the frontend:

```sh
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

## API Endpoints

Get today's universal color:

```sh
curl http://127.0.0.1:8080/api/colors/today
```

Get a color for a specific UTC date:

```sh
curl "http://127.0.0.1:8080/api/colors?date=2000-01-01"
```

Health check:

```sh
curl http://127.0.0.1:8080/healthz
```

## Build

Build the frontend:

```sh
cd frontend
npm run build
```

Build the backend:

```sh
cd backend
go build ./cmd/api
```

## Security Notes

The public API is intentionally read-only for now. Users can fetch colors, but
they cannot create, overwrite, or regenerate the universal color.

Important security concepts:

- Keep `DATABASE_URL` only on the backend. Never expose it through Vite.
- Anything prefixed with `VITE_` is public browser configuration.
- Use parameterized SQL queries.
- Keep the backend and database on private networking when deployed.
- Allow only the frontend origin in CORS.
- Put rate limiting at the reverse proxy, firewall, or CDN layer.
- Use HTTPS in production.
- Run the backend with a least-privilege database user.
- Do not deploy `.env` files into any web-served directory.

## Deploy To A Proxmox Ubuntu Server

This is a production-like single-server setup for an Ubuntu VM running inside
Proxmox. It keeps the frontend, backend, and database as separate services.

### 1. Create The VM

In Proxmox, create an Ubuntu Server VM with:

- 1-2 CPU cores
- 1-2 GB RAM for a small personal deployment
- 20+ GB disk
- A static IP or DHCP reservation

Update the VM:

```sh
sudo apt update
sudo apt upgrade
```

Install dependencies:

```sh
sudo apt install postgresql nginx git curl ufw
```

Install Go and Node.js from official packages or your preferred trusted source.

### 2. Create Deployment Directories

```sh
sudo mkdir -p /opt/colorwalk/backend
sudo mkdir -p /var/www/colorwalk
sudo mkdir -p /etc/colorwalk
sudo chown -R "$USER":"$USER" /opt/colorwalk /var/www/colorwalk
```

Keep secrets in `/etc/colorwalk`, not under `/var/www`.

### 3. Configure Postgres

Create a production database and migration-capable user:

```sh
sudo -u postgres psql
```

Inside `psql`, use a strong unique password:

```sql
CREATE DATABASE colorwalk;
CREATE USER colorwalk_api WITH PASSWORD 'replace_with_a_strong_password';
GRANT CONNECT ON DATABASE colorwalk TO colorwalk_api;
\c colorwalk
GRANT USAGE, CREATE ON SCHEMA public TO colorwalk_api;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO colorwalk_api;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO colorwalk_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO colorwalk_api;
```

Apply migrations from your checked-out project:

```sh
psql "postgres://colorwalk_api:replace_with_a_strong_password@127.0.0.1:5432/colorwalk?sslmode=disable" \
  -f backend/migrations/001_create_daily_colors.sql

psql "postgres://colorwalk_api:replace_with_a_strong_password@127.0.0.1:5432/colorwalk?sslmode=disable" \
  -f backend/migrations/002_seed_daily_colors.sql
```

For this first version, the API only reads colors. After migrations and seed data
exist, you can tighten the runtime database user to `SELECT` only until the
future server-side generation job is added.

For a stricter production setup, use one privileged owner or migration user to
apply schema changes, then run the API with a separate `colorwalk_runtime` user
that has only `SELECT` on `daily_colors`.

### 4. Build And Install The Backend

From the project checkout:

```sh
cd backend
go build -o colorwalk-api ./cmd/api
sudo cp colorwalk-api /opt/colorwalk/backend/colorwalk-api
```

Create the backend environment file:

```sh
sudo nano /etc/colorwalk/colorwalk-api.env
```

Example:

```text
ADDR=127.0.0.1:8080
ALLOWED_ORIGIN=https://your-domain.example
DATABASE_URL=postgres://colorwalk_api:replace_with_a_strong_password@127.0.0.1:5432/colorwalk?sslmode=disable
```

Lock down the file:

```sh
sudo chown root:root /etc/colorwalk/colorwalk-api.env
sudo chmod 600 /etc/colorwalk/colorwalk-api.env
```

Create a systemd service:

```sh
sudo nano /etc/systemd/system/colorwalk-api.service
```

Use:

```ini
[Unit]
Description=Color Walk API
After=network.target postgresql.service

[Service]
Type=simple
EnvironmentFile=/etc/colorwalk/colorwalk-api.env
ExecStart=/opt/colorwalk/backend/colorwalk-api
Restart=on-failure
RestartSec=5
User=www-data
Group=www-data
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=

[Install]
WantedBy=multi-user.target
```

Enable the backend:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now colorwalk-api
sudo systemctl status colorwalk-api
```

### 5. Build And Install The Frontend

In `frontend/.env.production`, set:

```text
VITE_API_BASE_URL=https://your-domain.example
```

Build:

```sh
cd frontend
npm install
npm run build
sudo rsync -a --delete dist/ /var/www/colorwalk/
```

### 6. Configure Nginx

Create:

```sh
sudo nano /etc/nginx/sites-available/colorwalk
```

Use:

```nginx
server {
    listen 80;
    server_name your-domain.example;

    root /var/www/colorwalk;
    index index.html;

    autoindex off;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        limit_req zone=colorwalk_api burst=20 nodelay;
    }

    location = /healthz {
        proxy_pass http://127.0.0.1:8080;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

Add rate limiting in `/etc/nginx/nginx.conf` inside the `http` block:

```nginx
limit_req_zone $binary_remote_addr zone=colorwalk_api:10m rate=5r/s;
```

Enable the site:

```sh
sudo ln -s /etc/nginx/sites-available/colorwalk /etc/nginx/sites-enabled/colorwalk
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Add HTTPS

Use Certbot or another TLS tool you trust. With Certbot:

```sh
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example
```

After HTTPS is active, update:

- `/etc/colorwalk/colorwalk-api.env`
- `frontend/.env.production`

Make sure `ALLOWED_ORIGIN` and `VITE_API_BASE_URL` use the final HTTPS origin.

Restart services:

```sh
sudo systemctl restart colorwalk-api
sudo systemctl reload nginx
```

### 8. Firewall

Allow SSH, HTTP, and HTTPS:

```sh
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Do not expose Postgres publicly.

## Troubleshooting

Backend logs:

```sh
sudo journalctl -u colorwalk-api -f
```

Nginx logs:

```sh
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

Check the backend from the server:

```sh
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/api/colors/today
```

Check the public route:

```sh
curl https://your-domain.example/api/colors/today
```
