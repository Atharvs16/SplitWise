# SplitEase

SplitEase is a React/Vite client and Express/PostgreSQL API for tracking shared expenses, groups, friends, and settlements.

## Requirements

- Node.js with npm
- PostgreSQL
- PostgreSQL with the schema in `Server/db/Splitwise Schema.sql`

The SQL file is a fresh-database schema snapshot, not an upgrade migration. Apply it only to a new, empty database. Existing databases need ordered migrations that preserve their data; do not rerun the snapshot against them.

## Configure the API

Create `Server/.env` with:

```text
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=splitease
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=replace_with_a_long_random_secret
PORT=3000
```

Keep real credentials in the ignored `.env` file; do not commit them.

Start the API:

```powershell
Set-Location Server
npm install
npm start
```

Run the API validation tests:

```powershell
Set-Location Server
npm test
```

## Run the client

In another terminal:

```powershell
Set-Location client
npm install
npm run dev
```

The client reads its API base URL from `client/.env.production` (`VITE_API_URL`). Production API requests use that URL; the Vite development proxy reads the same setting. Since `.env.production` is gitignored, configure `VITE_API_URL` in the frontend hosting provider's build environment as well. Cross-origin login and signup must include credentials, and the API's CORS origin must exactly match the deployed client origin.

Useful client checks:

```powershell
npm run lint
npm run build
```

## Current authentication support

Sign-up and password-based sign-in are connected to the API. OTP sign-in and password recovery are not implemented and are not offered in the client.
