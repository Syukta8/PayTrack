# PayTrack Architecture

<!-- MCP audit: workspace-agents.list_agents — read-only workspace context lookup, 2026-07-27. -->

> Implementation snapshot: 2026-07-30. This document describes the current worktree, including uncommitted schema changes.

## Overview

PayTrack is a client-side personal-finance application. It is a React 19 single-page application built with Vite and deployed as static files through Firebase Hosting. In connected mode, the browser authenticates a user with Firebase Authentication, receives a Google Sheets access token, and reads and writes the user's spreadsheet with the Google Sheets API. In demo mode, the same repository contract is backed by browser `localStorage`.

```text
React views and modals
        |
        v
View models and Tracker domain service
        |
        +--> SheetsRepository --> Google Sheets API v4 --> user-owned spreadsheet
        |
        +--> DemoSheetsRepository --> localStorage

Firebase Auth --> Google sign-in and Sheets OAuth token
Gemini API    --> optional browser-side receipt extraction
IndexedDB     --> local receipt-image cache
Firebase Hosting --> static SPA delivery
```

## Runtime layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Application bootstrap | `src/main.tsx` | Starts React Strict Mode, provides authentication state, and imports global styles. |
| App shell | `src/App.tsx` | Owns navigation, modal state, connection gates, theme selection, and coordinates Views with ViewModels. |
| Views | `src/components/` | Present finance screens and raise user intents through typed callback props. |
| ViewModels | `src/viewModels/` | Own async loading, spreadsheet connection state, receipt scan workflow, errors, and user-facing status. |
| Domain service | `src/model/tracker.ts` | Validates mutations and implements transactions, recurring bills, maintenance, mileage, service history, and summaries. |
| Repository abstraction | `src/model/sheets.ts` | Defines `SheetsStore` and its Google Sheets implementation. |
| Demo repository | `src/model/demo.ts` | Implements `SheetsStore` with seeded localStorage data. |
| Domain utilities | `src/model/domain.ts`, `duplicateGuard.ts`, `receiptVision.ts`, `receiptImage.ts` | Calculates statuses, detects likely duplicates, validates AI output, and prepares images. |
| Platform integrations | `src/model/firebase.ts`, `AuthContext.tsx`, `geminiConfig.ts`, `imageStore.ts` | Firebase Auth, Google Sheets OAuth token handling, Gemini configuration, and IndexedDB image storage. |

## Data flow

1. `AuthProvider` observes Firebase Authentication and requests a Google OAuth access token with the Sheets scope after sign-in.
2. `useTrackerViewModel` selects the repository:
   - `DemoSheetsRepository` when `VITE_DEMO_MODE=true`.
   - `SheetsRepository` when the user is authenticated, has a Sheets token, and has connected a spreadsheet.
3. `Tracker.load()` reads the relevant sheets and returns the `TrackerData` read model.
4. Views render `TrackerData` and send mutations to `Tracker` through callbacks supplied by `App`.
5. The mutation validates input, writes via `SheetsStore`, then `App` calls `reload()` to refresh the read model.

## Spreadsheet data model

The schema is centralized in `src/model/sheetSchema.ts`. Columns are positional; append new columns only at the end. `SheetsRepository.initializeTemplate()` creates or extends headers.

| Entity | Spreadsheet tab | Purpose |
| --- | --- | --- |
| `transactions` | `Transactions` | Income and expense records, including payment, tax, and service charge. |
| `receiptItems` | `ReceiptItems` | Receipt line items joined to a transaction by `transactionId`. |
| `bills` | `RecurringBills` | Active recurring bills, their last paid period, and their default payment method. |
| `maintenance` | `MaintenanceItems` | Vehicle maintenance intervals and the last completed service. |
| `carInfo` | `CarInfo` | Current odometer reading. |
| `serviceHistory` | `ServiceHistory` | Historical service entries. |

Receipt images are deliberately not stored in Sheets. They are an IndexedDB cache local to one browser/device; receipt line items are stored in the spreadsheet so they sync across devices.

`RecurringBills.paymentType` is the newest schema column. It is appended after `active` to preserve positional compatibility with existing sheets. During initialization, `SheetsRepository.initializeTemplate()` extends an older header; bill creation and editing default a missing payment method to `Online banking`, and bill payment carries it into the expense transaction.

Tax (`tax`) and Service Charge (`serviceCharge`) on the dashboard read model accumulate strictly from stored transaction records populated via the AI receipt scanner. Un-scanned or manual transactions default tax and service charge to 0, ensuring no dynamic category percentage estimates (e.g. 6% or 4%) are applied artificially.

## Authentication and external services

| Service | Use | Boundary |
| --- | --- | --- |
| Firebase Authentication | Google sign-in and OAuth session lifecycle | Firebase client SDK only. |
| Google Sheets API v4 | Persistent finance data | Browser sends bearer token to `https://sheets.googleapis.com/v4/spreadsheets/...`. |
| Gemini Generative Language API | Optional receipt OCR/extraction | Browser sends the receipt image and a restricted API key directly to Gemini. |
| Firebase Hosting | Production SPA delivery | `firebase.json` rewrites all routes to `index.html` and gives hashed assets long-lived caching. |

## Security model and limitations

- Data belongs to the signed-in user's Google Sheet; no application backend or shared database exists in this repository.
- Access is controlled by the user's Firebase/Google session and the scopes granted to the browser.
- Gemini is optional. `VITE_GEMINI_API_KEY` is exposed in the built client, so it must be API-restricted, referrer-restricted, quota-limited, and never committed.
- The spreadsheet ID and a Sheets token are retained in browser storage to restore a connected session. Users should use trusted devices and sign out where appropriate.
- The app does not implement Cloud Functions, server-side secret storage, or Firebase database rules in this source tree.

## Deployment and verification

- `npm run build` runs TypeScript project builds (`tsc -b`) followed by the Vite production build (`vite build`).
- `npm run lint` runs Oxlint over application source.
- Firebase Hosting serves `dist/`; deployment configuration lives in `firebase.json`.
- There is no automated test suite configured in `package.json`.
