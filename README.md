# SplitEase

SplitEase is a React/Vite client and Express/PostgreSQL API for tracking shared expenses, groups, friends, and settlements.

## Requirements

- Node.js with npm
- PostgreSQL
- A database schema compatible with the queries in `Server/queries`

The repository currently does not include SQL migrations or a schema bootstrap. Provision the required tables and constraints separately before using database-backed features.

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

Vite proxies `/api` requests to `http://localhost:3000`. To use another API port, update the proxy in `client/vite.config.js` to match `PORT`.

Useful client checks:

```powershell
npm run lint
npm run build
```

## Current authentication support

Sign-up and password-based sign-in are connected to the API. OTP sign-in and password recovery are not implemented and are not offered in the client.
