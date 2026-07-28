# PayTrack Features

> Implementation snapshot: 2026-07-27. This inventory reflects the current worktree, including uncommitted schema changes; it is not a product roadmap.

## Core finance tracking

| Feature | User outcome | Primary implementation |
| --- | --- | --- |
| Google sign-in and sheet connection | A user signs in, grants Google Sheets access, pastes a Sheet URL, and initializes its tabs. | `AuthContext.tsx`, `useTrackerViewModel.ts`, `sheets.ts`, `App.tsx` |
| Demo mode | The app can be used locally without Firebase or a Google Sheet. | `demo.ts`, `useTrackerViewModel.ts` |
| Income and expense entry | Users record an amount, date, category, payment method, details, tax, service charge, and optional receipt items. | `AddExpenseModal.tsx`, `tracker.ts` |
| Possible-duplicate warning | Users are warned before saving a likely duplicate but can continue intentionally. | `duplicateGuard.ts`, `AddExpenseModal.tsx` |
| Edit and delete transactions | Existing transactions can be changed or removed from the finance record. | `tracker.ts`, dashboard/receipt callbacks in `App.tsx` |
| Monthly dashboard | Users can select a month, view income, expenses, balance, category distribution, trends, and searchable recent receipts. | `HomeDashboardView.tsx` |

## Receipt capture and review

| Feature | User outcome | Primary implementation |
| --- | --- | --- |
| Manual receipt details | Receipt records include tax, service charge, and structured items. | `AddExpenseModal.tsx`, `tracker.ts`, `sheetSchema.ts` |
| Optional AI receipt scan | A photo is resized, sent to Gemini, validated, and converted into a pre-filled transaction draft. | `ScanReceiptModal.tsx`, `useReceiptScannerViewModel.ts`, `receiptVision.ts` |
| Receipt image cache | A saved receipt can be shown locally on the device that captured it. | `imageStore.ts`, `ReceiptDetailsView.tsx` |
| Receipt detail views | Users view totals, item search, visual analysis, and the locally cached image where available. | `ReceiptDetailsView.tsx` |

## Assisted import

| Feature | User outcome | Primary implementation |
| --- | --- | --- |
| Paste bank SMS | Users paste a notification and receive a transaction draft derived from its text. | `PasteSmsModal.tsx` |
| Statement reconciliation | Users upload a statement file, select parsed rows, and import them as transactions. | `StatementReconciliationModal.tsx` |

## Planned spending and maintenance

| Feature | User outcome | Primary implementation |
| --- | --- | --- |
| Recurring bills | Users add, edit, delete, and mark monthly, weekly, or yearly bills as paid. Each bill retains a default payment method; payment creates the associated expense record using that method. | `BillsView.tsx`, `tracker.ts`, `types.ts`, `sheetSchema.ts`, `domain.ts` |
| Installment/SPayLater display | Eligible transactions can be viewed and managed as installment plans in the bills experience. | `BillsView.tsx`, `AddExpenseModal.tsx` |
| Vehicle odometer | Users record the current mileage. | `MaintenanceView.tsx`, `tracker.ts` |
| Maintenance schedules | Users define date- and/or mileage-based maintenance tasks. | `MaintenanceView.tsx`, `tracker.ts`, `domain.ts` |
| Complete maintenance | Completion updates service state; an optional cost becomes an expense transaction. | `MaintenanceView.tsx`, `tracker.ts` |
| Service history | Users record and delete vehicle service records. | `tracker.ts`, `sheetSchema.ts` |

## Product constraints

- Finance data is stored directly in the connected Google Sheet; it is not stored in Firebase databases.
- Receipt images are device-local cache data and do not sync with the spreadsheet.
- AI receipt scanning requires a configured, restricted Gemini key and an internet connection.
- The user interface uses tab-based navigation (`home`, `bills`, `maintenance`, `settings`) rather than URL routes.
- The repository currently has build and lint scripts but no automated test command.
- Before publishing, inspect reachable history with `git log --all -p` or a dedicated secrets scanner. Remediate and rotate any exposed credentials before release.
