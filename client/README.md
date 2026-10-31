# SplitEase client

The client uses React, React Router, and Vite. For full-stack setup and the required API configuration, see the repository [README](../README.md).

```powershell
npm install
npm run dev
```

API requests use `VITE_API_URL` from `.env.production`; the Vite development proxy uses that same setting. Because `.env.production` is gitignored, configure this variable in your frontend hosting provider's build environment too.

Run the client checks with:

```powershell
npm run lint
npm run build
```
