# PayTrack Project Map

> Implementation snapshot: 2026-07-27. Generated from the current worktree, including uncommitted schema changes; it is not a replacement for reading the affected source before editing.

```text
PayTrack/
├── src/
│   ├── main.tsx                     Application entry point and provider composition
│   ├── App.tsx                      App shell, connection gates, navigation, modal coordination
│   ├── styles.css                   Shared responsive visual system
│   ├── components/                  Presentational screens and modals
│   │   ├── HomeDashboardView.tsx    Monthly totals, search, recent receipts, charts
│   │   ├── BillsView.tsx            Recurring bills and SPayLater/installment UI
│   │   ├── MaintenanceView.tsx      Odometer, service schedules, maintenance completion
│   │   ├── AddExpenseModal.tsx      Income/expense form and duplicate warning
│   │   ├── ScanReceiptModal.tsx     Receipt selection and scan workflow view
│   │   ├── ReceiptDetailsView.tsx   Receipt totals, items, image and analysis tabs
│   │   ├── QuickActionsModal.tsx    Entry points for add, scan, SMS, and reconciliation
│   │   ├── PasteSmsModal.tsx        Heuristic bank SMS parser and transaction draft
│   │   ├── StatementReconciliationModal.tsx  Statement upload and selected-item import
│   │   └── BottomNav.tsx            Mobile-style tab navigation
│   ├── viewModels/
│   │   ├── useTrackerViewModel.ts   Repository selection, sheet connection, load/reload state
│   │   └── useReceiptScannerViewModel.ts  Image preparation, Gemini scan, scan state
│   └── model/
│       ├── types.ts                 Shared domain types and payment-method normalization
│       ├── sheetSchema.ts           Google Sheet tabs, ordered columns, cell-type mapping
│       ├── sheets.ts                SheetsStore contract and Google Sheets REST repository
│       ├── demo.ts                  LocalStorage-backed demo repository and seed data
│       ├── tracker.ts               Finance application service and validation
│       ├── domain.ts                Bill and maintenance recurrence/status calculations
│       ├── duplicateGuard.ts        Advisory duplicate transaction detection
│       ├── firebase.ts              Firebase SDK configuration and Auth initialization
│       ├── AuthContext.tsx          Authentication and Google Sheets token context
│       ├── geminiConfig.ts          Gemini key resolution and configuration messages
│       ├── receiptImage.ts          Receipt image measurement and resizing
│       ├── receiptVision.ts         Gemini request, response validation, retry/error mapping
│       └── imageStore.ts            IndexedDB receipt-image cache and legacy item reader
├── .agents/                         Ignored private architecture and agent context
│   ├── ARCHITECTURE.md               Current system architecture and integration boundaries
│   ├── DECISIONS.md                  Implemented, accepted, and open technical decisions
│   ├── FEATURE.md                    Implemented feature inventory and constraints
│   └── PROJECTMAP.md                 Repository navigation and edit paths
├── index.html                       Vite HTML entry point
├── vite.config.ts                   Vite + React build configuration
├── tsconfig*.json                   TypeScript project configuration
├── package.json                     Scripts and dependency manifest
├── firebase.json                    Firebase Hosting rewrites, output directory, cache headers
├── .firebaserc                      Firebase project alias placeholder
├── .env.example                     Required client-side configuration variables
├── README.md                        Setup, deployment, and user-operated Sheet schema guide
└── may2026.pdf                       Ignored personal reference document; not application source
```

## Key edit paths

| Change | Primary files | Also inspect |
| --- | --- | --- |
| Add or change a persistent field | `src/model/types.ts`, `src/model/sheetSchema.ts` | `tracker.ts`, `sheets.ts`, `demo.ts`, `README.md`, and affected form/view code. For positional Sheets schema, append the column only. |
| Change a recurring bill payment method | `src/model/types.ts`, `src/model/sheetSchema.ts`, `tracker.ts`, `BillsView.tsx` | `sheets.ts`, `demo.ts`, `README.md`, and generated transaction behavior in `markBillPaid`. |
| Add a transaction workflow | `tracker.ts`, relevant modal/view, `App.tsx` | `useTrackerViewModel.ts`, duplicate behavior, reload/error states. |
| Change Google Sheets behavior | `sheets.ts` | `sheetSchema.ts`, `AuthContext.tsx`, demo parity, initialization flow. |
| Change bills or maintenance status | `domain.ts` | `types.ts`, `tracker.ts`, `BillsView.tsx`, `MaintenanceView.tsx`. |
| Change receipt scanning | `useReceiptScannerViewModel.ts`, `receiptVision.ts` | `geminiConfig.ts`, `receiptImage.ts`, `ScanReceiptModal.tsx`, `AddExpenseModal.tsx`. |
| Change authentication or connection UX | `AuthContext.tsx`, `firebase.ts`, `App.tsx` | `.env.example`, README setup, `useTrackerViewModel.ts`. |
| Change responsive visual design | affected component and `styles.css` | Both desktop and mobile viewports. |
| Change build or hosting behavior | `package.json`, `vite.config.ts`, `firebase.json` | README deployment instructions. |

## Important invariants

- `SheetsStore` is the persistence seam; preserve parity between `SheetsRepository` and `DemoSheetsRepository`.
- Spreadsheet rows are mapped by their fixed, ordered schema columns.
- `RecurringBills.paymentType` is appended after `active`; preserve its position and default legacy empty values to `Online banking` when writing or paying a bill.
- A transaction's receipt items are linked by `transactionId`; deleting a transaction must clean up its items.
- A receipt image is non-authoritative local cache data; Google Sheets holds finance data and receipt item records.
- The app must support configured connected mode and `VITE_DEMO_MODE=true`.
