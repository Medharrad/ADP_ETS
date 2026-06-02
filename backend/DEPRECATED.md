# ⚠️ Deprecated — retired

This Express + `node:sqlite` backend has been **consolidated into the Next.js app**
(`frontend/`) as route handlers under `frontend/src/app/api/*`, with the data-access
layer in `frontend/src/lib/server/`.

The root `npm run dev` no longer starts this service. The folder (and its `app.db`)
is kept only for reference/history. Nothing in the app depends on it anymore.
