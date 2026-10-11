# MEOW — private CHICHKA workspace (in development)

Stack: React + TypeScript + Vite frontend, PHP 8.4 / Slim 4 API, MariaDB 10.11.
Build locally, deploy compiled frontend + PHP API over **FTPS**, no Node on shared hosting.
The public Astro portfolio is independent. Neither app is affected until manually deployed.

## Security contract

- Google OpenID Connect only. **Two explicitly configured verified Gmail accounts**; any other identity is denied server-side.
- No self-service registration or credentials in git. Sessions via HttpOnly, SameSite=Lax cookie; CSRF token for mutations.
- OAuth callback validates signed Google ID token, issuer, nonce and state; allowed emails are read from private server environment.
- Ownership is keyed by Google subject `sub` and enforced on every data query. Two permitted accounts do NOT automatically share data.
- The frontend is PUBLICLY DOWNLOADABLE even before login; only authenticated API/data are private. Never put secrets in React.
- Login endpoint and API require working HTTPS in production.
- Configure access through `ALLOWED_GOOGLE_EMAILS=email1@gmail.com,email2@gmail.com` in server private settings. Fail closed if absent.

## Local requirements

PHP 8.4 with PDO MySQL, cURL and OpenSSL, Composer 2, Node.js 22+, MariaDB.

```bash
cd control/meow/backend
composer install
cp .env.example .env
# Create local MariaDB database + user. Run migrations/001_initial.sql.
# Configure DB_*, Google OAuth credentials and exactly two allowed emails.
composer serve
# Another terminal:
cd control/meow/frontend
npm install
npm run dev
```

Visit http://localhost:5173. Google Cloud OAuth redirect URI for local: `http://localhost:5173/api/auth/callback`.
Production redirect URI: `https://meow.chichkova.com/api/auth/callback`.
Do not reuse production OAuth client secrets in a publicly committed file.
Frontend talks to PHP through the Vite `/api` reverse proxy.

## Build locally

```bash
cd control/meow/frontend
npm run build
```

This creates `frontend/dist/` with static JS/CSS/index.html.

## FTPS deployment layout (not automated)

**First confirm cPanel's actual document root for `meow.chichkova.com`.**
Assuming it is `/home/jomko/meow.chichkova.com`:

```text
/home/jomko/
  meow.chichkova.com/            # PUBLIC DOCROOT
    index.html                   # frontend/dist
    assets/                      # frontend/dist
    .htaccess                    # frontend/public/.htaccess copied by Vite
    api/
      index.php                  # see below
      .htaccess                  # route /api/... to index.php
  meow-private/                  # NOT in any public domain docroot
    src/                         # backend/src
    vendor/                      # generated locally by Composer
    .env                         # private; NEVER git/FTP public root
```

**Important:** The development `backend/public/index.php` assumes `vendor/` is one directory above it. For shared hosting create a production entry file at public `api/index.php` pointing to `/home/jomko/meow-private/vendor/autoload.php` and `Meow\\App::run()`. Do NOT copy the dev entry as-is.

Install dependencies locally with `composer install --no-dev --optimize-autoloader`, then upload `vendor`, `src`, and private `.env` to the private directory; upload built `dist` and production API entry to public docroot.

**No production deployment is ready yet:** review Apache routing, cross-platform dependency compatibility, session persistence, OAuth callbacks, php.ini and a real MariaDB connection. Test with temporary staging, not on public MEOW, before making it live. Do not deploy the exploratory Refine prototype.

Database migration is initial SQL, not yet a versioned migration runner. Keep an independent backup before any schema changes.

## Current scope

Working code skeleton for Google auth, private Projects, Tasks, Markdown export and Today.
No Notes module yet; no team access, no production verification.
