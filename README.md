# Pocket Ledger

A responsive personal finance tracker built with React, Tailwind CSS, Express, MongoDB, and JWT authentication.

## Features

- Register and sign in to a personal account.
- Record, edit, and delete income and expense transactions.
- Review income, expenses, balance, and category spending.
- Filter transaction history by month, category, and type.
- View a six-month income and expense chart.
- Export the currently filtered transactions to CSV.
- Responsive dashboard layout for desktop and mobile.

## Requirements

- Node.js 20 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

## Run locally

1. Install the root development dependency:

   ```sh
   npm install
   ```

2. Install the app dependencies:

   ```sh
   npm install --prefix server
   npm install --prefix client
   ```

3. Copy `.env.example` to `server/.env` and set `MONGODB_URI` and a long, unique `JWT_SECRET`. Keep the secret out of source control.

4. Start the API and frontend:

   ```sh
   npm run dev
   ```

5. Open <http://localhost:5173>.

The API listens on port 5000 by default. Vite proxies `/api` requests to it. The API reports a startup error if it cannot connect to MongoDB.

## Production build

```sh
npm run build
npm start
```

Set `CLIENT_ORIGIN` to the deployed frontend origin and provide production `MONGODB_URI`, `JWT_SECRET`, and `PORT` environment variables on the API host. Deploy the contents of `client/dist` to a static frontend host, and deploy the Express server separately.

## API

- `POST /api/auth/register` — create an account
- `POST /api/auth/login` — sign in
- `GET /api/auth/me` — get the authenticated account
- `GET /api/transactions` — list the authenticated user's transactions
- `POST /api/transactions` — create a transaction
- `PUT /api/transactions/:id` — update an owned transaction
- `DELETE /api/transactions/:id` — delete an owned transaction

All transaction routes require `Authorization: Bearer <token>`. Transaction queries and mutations are scoped to the authenticated user.
