# Shree Steel Dynamic Website

Node.js + SQLite dynamic website for Shree Steel.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `ADMIN_PASSWORD` to the admin password you want to use.
3. Set `SESSION_SECRET` to a long random secret.
4. Run `npm install`.
5. Run `npm start`.
6. Open `http://localhost:3000`.

The `.env` file is ignored by Git and must never be committed.

## Production

Set `ADMIN_PASSWORD`, `SESSION_SECRET`, and `PORT` as environment variables in the hosting platform. Use HTTPS in production. The admin session cookie is HTTP-only and is marked Secure when `NODE_ENV=production`.
