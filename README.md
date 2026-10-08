# Personal Budget Manager — Ramesh Nerella

A monthly budget application for tracking income (received and expected) and expenses.
Everything is stored in a local SQLite database and managed from a responsive React dashboard.

```
Excel / seed data  →  SQLite  →  Node.js (Express) REST API  →  React  →  UI
```

The React app never reads seed files or keeps budget data in the browser. Every number on screen comes from the API, and every total is calculated from the transaction records when it is requested.

---

## 1. Features

- **Dashboard** for the selected month:
  - 10 cards: total, received and expected income; total, paid and pending expenses; available balance; potential balance; regular commitments; one-time expenses
  - Income vs Expenses chart
  - Expense breakdown by category (donut chart and table)
  - Expected income still to come this month (with a one-click **Received** button), payment-method summary and recent activity
- **Month dropdown built from the database.** Today it shows only _October 2026_. A month appears as soon as a record is saved in it, and disappears when its last record is deleted.
- **Due date and actual date** on every income (Due Date + Actual Received Date) and expense (Due Date + Actual Paid Date). A record counts in the month the money actually moved: the paid / received date once set, otherwise the due date (e.g. due in August but paid in October = October). The actual date fills in automatically when you mark it Received / Paid.
- **Income is Expected or Received.** Upcoming income is simply income with status **Expected** (there is no separate Upcoming page). Mark it **Received** on the Income page or the dashboard when the money arrives; every total updates straight away.
- **Sync across devices** (GitHub Pages version): your laptop, phone and tablet share the same data through your own private GitHub repository.
- **Income and Expenses pages**, each with:
  - add, edit and delete
  - one-click status change from the status badge
  - search, filters, sorting and pagination
  - select all, bulk status change and bulk delete (with confirmation)
- **Grouped, collapsible lists** (switchable), like the original budget sheet: expenses by category, income by type (**Salary**, **House Rent**, **Other Income**). Each group is an accordion header with its record count, how many are still pending / expected, and its subtotal; groups start closed (open one, or Expand all). While searching or filtering they open so matches stay visible.
- **Other Income** has a short form: Income Date, Income From, Amount and **Income By** (UPI, Phone Pay, GPay, Paytm, Bank Transfer or Cash).
- **Settings › Data Management**: JSON export, JSON import (replaces all data, asks first) and SQLite database backup, plus the full change history.
- Validation on both client and server, toast notifications, and loading, empty and error states.
- **Accessibility and theming:** light/dark theme, keyboard-accessible modals and menus, and statuses shown with an icon _and_ text.
- **Responsive from 320px to 1920px.** Tables become cards on phones, and the page never scrolls sideways.
- **Audit log:** a record of every create, update, status change, delete and import.

## 2. Technology stack

| Layer    | Technology                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | React 19, Vite, React Router, Bootstrap 5 + React-Bootstrap, SCSS, Chart.js (react-chartjs-2), React Icons, React-Toastify, sql.js (GitHub Pages build) |
| Backend  | Node.js (≥ 20), Express 5, Helmet, CORS, dotenv                                                                                                         |
| Database | SQLite via better-sqlite3 (repository pattern, ready to swap for PostgreSQL/MySQL)                                                                      |
| Tooling  | npm workspaces, ESLint, Prettier, Node test runner                                                                                                      |

## 3. Folder structure

```
budget-manager/
├── package.json                 npm workspaces + root scripts (dev, build, test, lint...)
├── eslint.config.js / .prettierrc.json / .editorconfig
├── database/                    budget.sqlite lives here (git-ignored), backups/ too
│
├── server/
│   ├── .env.example             copy to server/.env
│   ├── tests/                   api.test.js + auth.test.js (in-memory database)
│   └── src/
│       ├── server.js            entry point: migrations → first-run seed → listen
│       ├── app.js               Express app: security, JSON, routes, errors
│       ├── config/env.js        ALL backend configuration
│       ├── constants/index.js   statuses, expense types, limits (single source of truth)
│       ├── routes/              index.js lists EVERY endpoint
│       ├── controllers/         HTTP ⇄ service only (no rules, no SQL)
│       ├── services/            business rules; createRecordService.js = shared CRUD workflow
│       ├── validators/          input validation (FieldValidator + one file per record type)
│       ├── repositories/        ALL SQL lives here (parameterised queries)
│       ├── middleware/          error handler, 404, request logger, static client
│       ├── utils/               money (paise ⇄ rupees), dates, errors
│       └── database/
│           ├── connection.js    the single SQLite connection + transactions
│           ├── migrator.js      applies migrations/*.sql once, in order
│           ├── migrations/001_initial_schema.sql   tables, indexes, lookups
│           ├── seed-data/october-2026.json         initial data from the Excel sheet
│           └── scripts/         npm run migrate / seed / seed:reset
│
└── client/
    ├── index.html, vite.config.js (dev proxy /api → :5000)
    └── src/
        ├── main.jsx, App.jsx    bootstrapping, providers, routes
        ├── pages/               Dashboard, Income, Expenses, Settings, NotFound
        ├── components/
        │   ├── layout/          AppHeader (navigation), AppFooter, AppLayout
        │   ├── common/          StatusBadge, StatusMenu, ConfirmDialog, StatCard, MonthSelector, ...
        │   │   ├── form/        FormField + RecordFormModal (config-driven add/edit modal)
        │   │   ├── table/       DataTable, RecordCardList (mobile), FilterBar, BulkActionsBar, ...
        │   │   └── records/     RecordManager (complete CRUD screen) + column/filter helpers
        │   ├── dashboard/       SummaryCards, charts, breakdown, payment methods, activity
        │   ├── income/          useIncomeConfig.js       ← everything specific to Income
        │   ├── expenses/        useExpenseConfig.jsx     ← everything specific to Expenses
        │   └── settings/        export / import / backup cards
        ├── context/             BudgetContext (month, lookups, refresh), ThemeContext
        ├── hooks/               useApiData, useTableState, useSelection, useRecordActions, ...
        ├── services/            api.js (the only API code) + one file per API area
        ├── local-backend/       GitHub Pages build: SQLite + server code running in the browser
        ├── utils/               formatters (₹, dates), validation, table helpers, months
        ├── constants/           routes, status appearance, page sizes, form limits
        └── styles/              SCSS partials (see section 12)
```

### Where do I find...?

| I want to change...                  | Look in                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| The dashboard layout                 | `client/src/pages/Dashboard.jsx`, `client/src/components/dashboard/`                        |
| Dashboard numbers / formulas         | `server/src/services/dashboardService.js`, `server/src/repositories/dashboardRepository.js` |
| Income page columns, filters, form   | `client/src/components/income/useIncomeConfig.js`                                           |
| Expense page columns, filters, form  | `client/src/components/expenses/useExpenseConfig.jsx`                                       |
| Behaviour shared by all record pages | `client/src/components/common/records/RecordManager.jsx`                                    |
| API endpoints                        | `server/src/routes/index.js`                                                                |
| SQL queries                          | `server/src/repositories/`                                                                  |
| Validation rules                     | Server: `server/src/validators/` · Client: `client/src/utils/validation.js`                 |
| Statuses / expense types             | `server/src/constants/index.js` (+ badge look in `client/src/constants/index.js`)           |
| Colours, spacing, fonts              | `client/src/styles/_variables.scss`                                                         |
| Currency / date formatting           | `client/src/utils/formatters.js`                                                            |
| Navigation links                     | `client/src/components/layout/AppHeader.jsx` (`NAV_ITEMS`)                                  |

## 4. Installation

Requirements: **Node.js 20 or newer** (22 LTS recommended) and npm.

```bash
cd budget-manager
npm install
```

This installs the root, `server` and `client` workspaces in one go.

## 5. Environment variables

```bash
cp server/.env.example server/.env      # Windows PowerShell: Copy-Item server/.env.example server/.env
```

| Variable                | Default                        | Meaning                                                                                                                     |
| ----------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                  | `5000`                         | API port                                                                                                                    |
| `DATABASE_PATH`         | `./database/budget.sqlite`     | SQLite file (relative to the project root)                                                                                  |
| `BACKUP_DIR`            | `./database/backups`           | Where "Backup Database" writes copies                                                                                       |
| `CORS_ORIGIN`           | `http://localhost:5173`        | Comma-separated browser origins allowed to call the API                                                                     |
| `SEED_ON_EMPTY`         | `true`                         | Load seed data automatically when the database is empty                                                                     |
| `SEED_FILE`             | `./database/seed.private.json` | Private seed file with your real data (git-ignored). If missing, fictional sample data is used                              |
| `NODE_ENV`              | `development`                  | `development` logs each API request                                                                                         |
| `APP_PASSWORD`          | _(empty)_                      | Sign-in password. **Required in production** (the server refuses to start without it). Empty = no login, for local use only |
| `SESSION_SECRET`        | _(random per start)_           | Signs the session cookie. Set a long random value in production so restarts don't sign you out                              |
| `SESSION_MAX_AGE_HOURS` | `12`                           | How long a sign-in lasts                                                                                                    |

The `.env` file is git-ignored. The frontend holds no secrets. In development, Vite proxies `/api` to the server, so the browser makes same-origin calls.

## 6. Database setup and seed data

You don't need to do anything for the first run: `npm run dev` / `npm start` applies the migrations and, if the database is empty, loads the seed data.

Manual commands:

```bash
npm run migrate       # create / upgrade the schema
npm run seed          # load seed data (only if the database has no data) - see "Seed data" below
npm run seed:reset    # REPLACE all budget data with the seed data
```

**Schema** (`server/src/database/migrations/001_initial_schema.sql`):

| Table             | Purpose                                                                                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`           | Owner profile (Ramesh Nerella); ready for multiple users                                                                                                                                                  |
| `months`          | Months that have data — the month dropdown is read from here                                                                                                                                              |
| `categories`      | Property & Savings, Interest & Finance, Household & Personal, Additional / One-Time                                                                                                                       |
| `payment_methods` | Phone Pay, UPI, Cash, Bank Transfer, Card, Other                                                                                                                                                          |
| `income`          | Income type (Salary / House Rent / Other Income), due date, actual received date, source, amount, purpose, status (Expected/Received), payment method, reference, notes                                   |
| `expenses`        | Due date, actual paid date, category, payee, amount, purpose, type (Regular/Additional), payment method, reference, end date of the commitment (e.g. 2038, Nov-2027), status (Paid/Pending/Closed), notes |
| `audit_logs`      | Created / Updated / Status Changed / Deleted / Imported history                                                                                                                                           |

- Money is stored as **integer paise**, so totals are exact. The API always works in rupees.
- Dates are `YYYY-MM-DD`; months are `YYYY-MM`. A record belongs to the month of its **paid / received date** when set, otherwise its **due date** (`budgetMonthKey` in `server/src/utils/dates.js`). Changing the status or the actual date can therefore move a record to another month; migration `004_month_follows_actual_date.sql` applied this to existing records.
- **Actual dates follow the status.** The Received / Paid date can only be set when the status is Received (income) or Paid/Closed (expense). Changing the status from the badge or bulk actions fills it with today, or clears it.
- **Upcoming income = income with status Expected.** Migration `003_expected_income_replaces_upcoming.sql` turned income _Pending_ into _Expected_ and moved the old `upcoming_income` rows into `income`. Rows already in Income were skipped: linked ones, and ones with the same month, source and amount as one income record or as all of them together.
- Every table has `created_at`, and record tables have `updated_at`, which changes on every edit or status change.
- Indexes cover month, date, status, category and payment method.
- **No totals are stored.** They are calculated from records on each request.

### Seed data: real data stays private

This repository is public, so **real budget data is never committed**. Seeding picks its file like this:

| File                                                      | Committed?                                                              | Used when                                                               |
| --------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `database/seed.private.json` (or the path in `SEED_FILE`) | **No** — git-ignored (`*.private.json`) and excluded from Docker images | It exists. This holds your real October 2026 data from the budget sheet |
| `server/src/database/seed-data/sample-data.json`          | Yes                                                                     | No private file exists. **Fictional** demo data, also used by the tests |

Both files use the export format, so either one can also be loaded with **Settings › Import Data**.
That is how real data gets onto a deployed site: deployments start empty (`SEED_ON_EMPTY=false` in the Dockerfile), and you import the file after signing in.

To create a private seed file on a new computer:

1. Run the app with your data.
2. Use Settings › Export Data.
3. Save the file as `database/seed.private.json`.

Fictional sample data totals (October 2026):

|                                                   |                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Total income                                      | ₹1,03,000 (received ₹85,000 · expected ₹18,000: House Rent ₹6,000, Freelance Project ₹9,000, Loan Interest ₹3,000)            |
| Total expenses                                    | ₹54,200 (all paid) — Property & Savings ₹38,000 · Interest & Finance ₹6,500 · Household & Personal ₹6,200 · Additional ₹3,500 |
| Regular commitments                               | ₹50,700                                                                                                                       |
| Available balance (received − paid)               | ₹30,800                                                                                                                       |
| Potential balance (total income − total expenses) | ₹48,800                                                                                                                       |

## 7. Running the application

### Development (hot reload)

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api (e.g. http://localhost:5000/api/health)

Run each side separately with `npm run dev -w server` and `npm run dev -w client`.

### Production build (one port)

```bash
npm run build      # builds client/dist
npm start          # Express serves the API and the built app at http://localhost:5000
```

## 8. API documentation

All endpoints are under `/api`. Success responses are `{ "data": ... }`.
Errors are `{ "error": { "code", "message", "details?" } }`, where `details` maps field names to messages.
Status codes: `200` OK, `201` created, `400` validation, `404` not found, `413` too large, `500` server/database error. Raw database errors are never returned.

| Method | Endpoint                   | Body                                     | Description                                                      |
| ------ | -------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| GET    | `/health`                  |                                          | Health check                                                     |
| GET    | `/meta`                    |                                          | Owner, categories, payment methods, statuses, expense types      |
| GET    | `/months`                  |                                          | Months with data, e.g. `["2026-10"]`                             |
| GET    | `/dashboard?month=2026-10` |                                          | `summary`, `counts`, `categoryBreakdown`, `paymentMethodSummary` |
| GET    | `/activity?limit=50`       |                                          | Audit log, newest first                                          |
| GET    | `/income?month=2026-10`    |                                          | Income records for a month                                       |
| GET    | `/income/:id`              |                                          | One record                                                       |
| POST   | `/income`                  | income                                   | Create                                                           |
| PUT    | `/income/:id`              | income                                   | Full update                                                      |
| PATCH  | `/income/:id/status`       | `{ "status": "Received" }`               | Change status only                                               |
| DELETE | `/income/:id`              |                                          | Delete                                                           |
| POST   | `/income/bulk-status`      | `{ "ids": [1,2], "status": "Received" }` | Bulk status (one transaction)                                    |
| POST   | `/income/bulk-delete`      | `{ "ids": [1,2] }`                       | Bulk delete (one transaction)                                    |
| …      | `/expenses…`               | expense                                  | Same 8 endpoints as income                                       |
| GET    | `/data/export`             |                                          | Full JSON export (downloadable file)                             |
| POST   | `/data/import`             | export file                              | Replace ALL budget data (validated first; all-or-nothing)        |
| POST   | `/data/backup`             |                                          | Copy the SQLite file into `BACKUP_DIR` (safe while running)      |

**Record bodies** (`*` = required):

```jsonc
// income
{ "dueDate*": "2026-10-25", "receivedDate": null, "source*": "House Rent", "amount*": 6000, "status*": "Expected",
  "paymentMethodId": 2, "purpose": null, "reference": null, "notes": null }

// expense
{ "dueDate*": "2026-10-05", "paidDate": "2026-10-05", "categoryId*": 1, "payee*": "Home Loan EMI", "amount*": 30000,
  "expenseType*": "Regular", "paymentMethodId*": 1, "status*": "Paid",
  "purpose": "Home loan", "reference": "Loan Account", "endPeriod": "2040", "notes": null }
```

Validation: amount > 0 (max 2 decimals); real calendar dates; text ≤ 200 characters (notes ≤ 1000); statuses and types must be allowed values; category and payment method must exist; `receivedDate` only with status Received, `paidDate` only with Paid or Closed.

Export files are format **version 3**: income and expenses only, each with `dueDate` and `receivedDate` / `paidDate`. Older files still import:

- version 1 (`date` only): `date` is used as the due date;
- versions 1–2: income _Pending_ becomes _Expected_, and their `upcomingIncome` list becomes Expected income, with entries already in Income skipped as in the migration above.

Example:

```bash
curl "http://localhost:5000/api/dashboard?month=2026-10"
curl -X PATCH -H "Content-Type: application/json" -d '{"status":"Received"}' http://localhost:5000/api/income/3/status
```

## 9. Testing

```bash
npm test        # API + login tests against an in-memory database (31 tests)
npm run lint    # ESLint for server and client
npm run format  # Prettier
```

The tests cover:

- seed totals, the month list and the breakdowns
- House Rent Expected → Received updating the dashboard; only Expected/Received allowed
- full CRUD
- validation errors
- months appearing and disappearing
- expense Paid → Pending → Closed
- records counted in the month they were paid / received (due August, paid October = October)
- income types (and inferring them for older import files), GPay / Paytm
- bulk status and bulk delete
- expected income bulk-marked Received and back
- export/import round trip, importing older files (upcoming income → Expected income), rejected imports, the audit trail and JSON errors

**Manual checklist** (run `npm run dev`):

1. The dashboard shows _October 2026_ only, with totals as in section 6.
2. Income → find the **Expected** House Rent → click its badge → **Received**. A toast appears, the summary's Expected total drops, and on the dashboard Expected Income drops and Available Balance rises by that amount. No reload is needed. (The dashboard's Expected Income panel has the same **Received** button.)
3. Edit the same record (pencil icon) → set the status back to Expected → Save.
4. Expenses → change one expense to Pending, then Closed, and check the dashboard's Pending Expenses.
5. Tick several rows → **Change Status** / **Delete Selected**. A confirmation appears first.
6. Add Expense → Save with empty fields to see the validation messages.
7. Add an income dated in November 2026: _November 2026_ appears in the month dropdown. Delete it and the month disappears again.
8. Try search, every filter, column sorting, and the "Group by category" switch.
9. Settings → Export, Import (with the exported file) and Backup.
10. Resize to a phone width (320–425px): cards replace tables, filters fold under **Filters**, the menu collapses, and nothing scrolls sideways.

## 10. How to add a new feature

**Add a field to expenses** (e.g. "Account Holder"):

1. Add a migration `server/src/database/migrations/002_add_account_holder.sql`:
   `ALTER TABLE expenses ADD COLUMN account_holder TEXT;`
2. `server/src/repositories/expenseRepository.js`: add the column to `SELECT_EXPENSE`, `toExpense`, `toRowParams`, `create` and `update`.
3. `server/src/validators/expenseValidator.js`: `accountHolder: v.optionalText('accountHolder', 'Account holder')`.
4. Optional: add it to `auditedFields` in `server/src/services/expenseService.js` and to the export in `dataService.js`.
5. `client/src/components/expenses/useExpenseConfig.jsx`: add a form field, a column (`textColumn(...)`), and include it in `toFormValues` / `toPayload`.

**Add a status** (e.g. expense "Partially Paid"):

1. Add it to `server/src/constants/index.js`.
2. Add a migration that updates the table's CHECK constraint. SQLite needs a table rebuild for this; follow the standard "create new table → copy → rename" pattern.
3. Add its badge icon/tone in `STATUS_APPEARANCE` (`client/src/constants/index.js`).

**Add a page:**

1. Create `client/src/pages/Reports.jsx`.
2. Add a `<Route>` in `App.jsx` and an entry in `NAV_ITEMS` (`AppHeader.jsx`).
3. Put API calls in a new `client/src/services/*Service.js`, and the endpoint in `server/src/routes/index.js` → controller → service → repository.

**Add a new record type** (e.g. savings goals): follow how income is built.

- Server: a repository, a validator, `createRecordService({...})`, `createRecordController(service)`, and `router.use('/savings', createRecordRouter(controller))`.
- Client: `createRecordService('/savings')`, a `useSavingsConfig` hook, and a page that renders `<RecordManager config={config} />`.

## 11. How to modify existing components

- **Table columns:** edit the `columns` array in the record's config hook. Helpers: `dateColumn`, `textColumn`, `amountColumn`, `statusColumn`. `showInCard: true` also shows the column on mobile cards.
- **Filters:** use `selectFilter(key, label, options)` or `dateRangeFilters('date')` in the config.
- **Form fields:** edit the `formFields` array (`type`: text, textarea, amount, date, select). Validation follows `required`, `type`, `maxLength` and an optional `validate(value, values)`.
- **Dashboard cards:** `client/src/components/dashboard/SummaryCards.jsx`. New numbers belong in `dashboardService.buildSummary` on the server.
- **Messages and toasts:** `client/src/hooks/useRecordActions.js`.
- **Empty and loading text:** `emptyTitle` / `emptyMessage` in each config; shared components are in `components/common/StateBlocks.jsx`.

## 12. Styling (SCSS)

`client/src/styles/main.scss` imports small partials. Bootstrap handles layout, grid and utilities; the SCSS handles the app's own look.

| File                                                          | Contents                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `_variables.scss`                                             | Typography, spacing, radius, breakpoints, light & dark colour maps |
| `_mixins.scss`                                                | `media-up`, `media-down`, `surface-card`, `focus-ring`, `tone`     |
| `_theme.scss`                                                 | Emits `--app-*` CSS variables and maps Bootstrap to them           |
| `_base.scss`, `_layout.scss`                                  | Elements, header, navigation, page header, footer                  |
| `_buttons.scss`, `_cards.scss`, `_forms.scss`, `_badges.scss` | Components                                                         |
| `_tables.scss`                                                | Tables, mobile cards, filter bar, bulk bar, groups, pagination     |
| `_charts.scss`, `_components.scss`, `_responsive.scss`        | Charts, states/modals/toasts, small-screen tweaks                  |

Chart colours are `--app-chart-1…4` and have been checked for colour-blind separation in both themes.

## 13. Database migrations

- The schema lives in `server/src/database/migrations/NNN_description.sql`.
- Each file runs once, in filename order, inside a transaction, and is recorded in `schema_migrations`.
- **Never edit an applied migration.** Add the next number (`002_...sql`) instead.
- Migrations run automatically on start, or with `npm run migrate`.
- Before a risky change, use **Settings › Backup Database** (or copy `database/budget.sqlite`).

**Moving to PostgreSQL/MySQL:**

1. Replace `server/src/database/connection.js` and the SQL in `server/src/repositories/`.
2. Make the repository methods `async`, and `await` them in `createRecordService.js`, `dashboardService.js` and `dataService.js`.

Controllers, routes, validators and the whole frontend stay the same.

## 14. Login, build and deployment

### Live site: GitHub Pages (free)

**https://rameshneralla.github.io/budget-manager/**

GitHub Pages only hosts static files, so this build (`npm run build:pages`) runs the **same SQLite database and the same server code inside the browser**.
`client/src/local-backend/` answers the API calls; nothing is rewritten:

- `localApi.js`: the API routes. They call the unchanged services, validators and repositories from `server/src`, bundled into the page.
- `sqliteAdapter.js`: lets sql.js (SQLite compiled to WebAssembly) behave like better-sqlite3.
- `browserDatabase.js` / `browserStorage.js`: open the database, apply the same `migrations/*.sql`, and save it in IndexedDB.
- `shims/`: browser stand-ins for the three Node-only server modules. `client/vite.config.js` swaps them in for the Pages build only.

What this means for you:

- **Your data stays on your device.** It is saved in the browser's storage and never uploaded, so the public site has no login and no personal data.
- **First use:** open the site, go to **Settings › Import Data**, and choose `database/seed.private.json` (or any export file).
- **Each browser starts with its own copy.** To share one budget across your laptop, phone and tablet, turn on **Sync across devices** (below). Otherwise use Export and Import, and export regularly; clearing the site's browser data deletes it.

### Sync across devices (private GitHub repository)

Free, and the data goes only to your own **private** repository; the app refuses to sync to a public one.

One-time setup (the steps are also shown in **Settings › Sync across devices**):

1. Create a **private** repository named `budget-manager-data` (https://github.com/new).
2. Create a fine-grained access token (https://github.com/settings/personal-access-tokens/new):
   - Repository access: _Only select repositories_ → `budget-manager-data`
   - Permissions: _Contents: Read and write_
3. On each device, open Settings › Sync across devices, enter `Rameshneralla/budget-manager-data` and the token, then click **Connect this device**.
   - The first device uploads its data.
   - Each further device downloads it.
   - If both already have data, you choose which copy to keep.

How it works (`client/src/local-backend/sync/`):

- The whole SQLite file is stored as `budget.sqlite` in that repository, so ids, history and links are identical on every device.
- Every change downloads the latest copy if needed, applies the change, and uploads it. If another device uploaded in between, the change is re-applied on top of that copy.
- Opening the app, or returning to it, downloads changes from other devices.
- Offline changes stay on the device and upload later. If the other copy also changed meanwhile, Settings asks which copy to keep.
- The token is stored only in that browser (`localStorage`) and is sent only to `api.github.com`. **Disconnect this device** removes it.
- The header's cloud icon shows the sync status.
- **Backup Database** downloads the `.sqlite` file.

Deploy an update:

```bash
npm run deploy:pages      # builds client/dist-pages and pushes it to the gh-pages branch
```

The first time, enable Pages in GitHub: **Settings › Pages › Build and deployment › Deploy from a branch › `gh-pages` / `(root)`**.

### Install as an app (PWA)

RBM can be installed on phones, tablets and laptops straight from the website, with no Play Store or App Store.
After installing, it opens in its own window with the round **RBM** icon and works offline.

| Device                                                             | How                                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Android, Windows, macOS, ChromeOS (Chrome, Edge, Samsung Internet) | An **Install RBM app** card appears; or use the ⤓ button in the header                    |
| iPhone / iPad (Safari)                                             | The card shows the steps: **Share → Add to Home Screen** (Apple allows no install pop-up) |

Files:

- `client/public/manifest.webmanifest`: app name, colours and icons.
- `client/public/sw.js`: service worker, required for installing. It keeps offline copies of the app files; budget data is never cached.
- `client/src/pwa/installApp.js`, `components/common/InstallApp.jsx`: the install button and card. "Not now" hides the card for 14 days.

**App icon:** the source is `client/icon-source/rbm-logo.svg` (round) and `rbm-logo-maskable.svg` (full-bleed, for Android icon shapes and iOS).
After editing them, regenerate the PNGs in `client/public/icons` with `node scripts/generate-icons.mjs`. It needs Chrome or Edge; set `CHROME_PATH` if yours isn't found.
The header logo is the same design (`components/common/RbmLogo.jsx`).

Test the Pages build locally:

```bash
npm run build:pages
npm run preview:pages -w client    # http://localhost:4173/budget-manager/
```

### Login

Set `APP_PASSWORD` in `server/.env` to require a password. How it works:

- The password is checked on the server (`server/src/services/authService.js`) and is never stored in the database.
- A successful sign-in sets a signed, `httpOnly`, `SameSite=Strict` cookie (and `Secure` in production).
- Every API route except `/api/health` and `/api/auth/*` requires that cookie (`server/src/middleware/requireAuth.js`).
- After 5 wrong passwords, that address is blocked for 15 minutes.

Auth endpoints:

| Method | Endpoint        | Body                    | Description                                                               |
| ------ | --------------- | ----------------------- | ------------------------------------------------------------------------- |
| GET    | `/auth/session` |                         | `{ authRequired, authenticated }`                                         |
| POST   | `/auth/login`   | `{ "password": "..." }` | Signs in (sets the cookie); `401` wrong password, `429` too many attempts |
| POST   | `/auth/logout`  |                         | Signs out                                                                 |

On the client, `AuthContext.jsx` shows `pages/LoginPage.jsx` until signed in, and returns to it if the session expires. The sign-out button is in the header.

### Build and run in production

```bash
npm install
npm run build
NODE_ENV=production APP_PASSWORD="choose-a-strong-password" SESSION_SECRET="long-random-string" npm start
# PowerShell: $env:NODE_ENV="production"; $env:APP_PASSWORD="..."; $env:SESSION_SECRET="..."; npm start
```

Generate a session secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

### Deploying (Docker — Railway, Render, Fly.io, any VPS)

The `Dockerfile` builds the client and runs the API, which serves the app on one port.
The database is stored in **`/data`**, so attach a **persistent volume at `/data`**; without one, all data is lost on every redeploy.
Set these variables on the host:

| Variable         | Value                            |
| ---------------- | -------------------------------- |
| `APP_PASSWORD`   | your sign-in password (required) |
| `SESSION_SECRET` | long random string               |

`PORT`, `DATABASE_PATH=/data/budget.sqlite` and `BACKUP_DIR=/data/backups` are preset in the image; Railway/Render override `PORT` automatically.
The live database starts **empty**, because no personal data is in the repository or the image. After the first sign-in, go to **Settings › Import Data** and choose your `database/seed.private.json` (or any export file).

**Railway** (uses `railway.json`):

```bash
npm i -g @railway/cli
railway login
railway init                          # create a project
railway up                            # build & deploy from this folder
railway volume add --mount-path /data # persistent storage for SQLite
railway variables --set "APP_PASSWORD=..." --set "SESSION_SECRET=..."
railway domain                        # generates the public https URL
```

**Render:** create a _Web Service_ from the GitHub repo with runtime _Docker_, add a _Disk_ mounted at `/data` (paid plans only; the free plan's storage is wiped on restart), and set the variables.

**Fly.io:**

```bash
fly launch --no-deploy
fly volumes create data --size 1
```

Then add `[mounts] source="data" destination="/data"` to `fly.toml`, run `fly secrets set APP_PASSWORD=... SESSION_SECRET=...`, and run `fly deploy`.

Back up regularly with Settings › Backup Database (written to `/data/backups`) or Settings › Export Data (downloads a JSON copy).

## 15. Ready for later

The structure leaves room for these without restructuring:

- multiple users (`users` table; login is in `authService.js`)
- PostgreSQL
- CSV/Excel/PDF export (`dataService`)
- yearly reports (month keys are indexed)
- recurring transactions (`expense_type = 'Regular'`)
- budget limits per category
- attachments
- audit history (already recorded)
