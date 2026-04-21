# POS & Inventory System

Minimal-cost, production-ready POS and inventory system using Next.js + Google Apps Script + Google Sheets.

## Project Overview

This project is designed for small businesses that need a practical POS and stock solution with low infrastructure cost and clear code structure.

## Features

- Inventory CRUD (list/add/edit/delete)
- POS sales flow (search, cart, quantity updates, checkout)
- Profit-aware sales recording
- Daily and monthly report summaries
- Fast and slow moving item analytics (frontend derived)
- Mock-first fallback for local/offline-friendly development

## Tech Stack

- Frontend: Next.js (App Router), TypeScript, TailwindCSS
- UI: shadcn-style reusable components
- Backend: Google Apps Script Web App (REST-like action API)
- Database: Google Sheets
- Hosting: Vercel (frontend), Apps Script (backend)

## Architecture

```text
User -> Vercel (Next.js) -> Google Apps Script -> Google Sheets
```

## Folder Structure

```text
src/
  app/
    dashboard/
    inventory/
    sales/
    reports/
    vendors/
  components/
    layout/
    ui/
  services/
    api.ts
    inventory-service.ts
    sales-service.ts
    reports-service.ts
    mock-db.ts
  types/
  utils/
apps-script/
  Code.gs
.github/workflows/
  ci.yml
```

## Setup Steps

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Add API URL in `.env.local`:

- `NEXT_PUBLIC_API_URL=<your-apps-script-web-app-url>`

4. Run locally:

```bash
npm run dev
```

## Google Sheets Setup

Spreadsheet ID (default in backend sample):

- `1TryXVVdDiewv_epYMBal0pH3gI90bYhi1d4nCz1d-OU`

Create these sheets with header row (row 1):

### `items`

- `id`, `name`, `brand`, `category`, `purchasePrice`, `sellingPrice`, `quantity`

### `sales`

- `transactionId`, `itemId`, `quantity`, `sellingPrice`, `purchasePrice`, `profit`, `createdAt`

### `vendors`

- `vendorId`, `name`, `contact`

## Google Apps Script Deployment

1. Open the target Google Sheet.
2. Go to Extensions -> Apps Script.
3. Paste `apps-script/Code.gs`.
4. Confirm `SHEET_ID` in code.
5. Deploy -> New deployment -> Web app.
6. Execute as: Me.
7. Access: Anyone with the link (or your policy).
8. Deploy and copy the Web App URL.

### API URL

The copied Web App URL is your `NEXT_PUBLIC_API_URL`.

### Supported Actions

- `GET ?action=getItems`
- `POST { "action": "createItem", ...item }`
- `POST { "action": "updateItem", "id": "...", ...item }`
- `POST { "action": "deleteItem", "id": "..." }`
- `POST { "action": "createSale", "lines": [{ "itemId": "...", "quantity": 1 }] }`
- `GET ?action=getDailyReport`
- `GET ?action=getMonthlyReport`

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Apps Script Web App URL

## Vercel Deployment

1. Push repository to GitHub.
2. Import project in Vercel.
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL`
4. Deploy.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run format`
- `npm run type-check`

## CI

GitHub Actions pipeline runs on push and pull_request:

- install dependencies
- lint
- type-check
- build

## Future Improvements

- Vendor CRUD UI and item-vendor linking
- Backend endpoints for fast/slow moving reports
- Offline queue with retry sync
- Auth and role-based access control
- Easy migration adapter (e.g. Supabase/Postgres)
