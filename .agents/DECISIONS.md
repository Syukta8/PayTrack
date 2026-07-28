# PayTrack Decisions

> Implementation snapshot: 2026-07-27. Includes the current worktree, including uncommitted schema changes. Entries marked **Inferred** reflect current code and configuration, not necessarily a separately approved ADR.

| ID | Decision | Status | Rationale and consequence |
| --- | --- | --- | --- |
| D-001 | Use a Vite + React SPA | Implemented | Keeps deployment static and lightweight. Routing is represented by in-app tab state rather than React Router routes. |
| D-002 | Use Firebase Authentication for Google sign-in | Implemented | Provides the identity and OAuth session used to access Google Sheets. Required Firebase values are supplied through `VITE_FIREBASE_*` variables. |
| D-003 | Store finance data in a user-owned Google Sheet | Implemented | Maximizes user ownership and avoids an application database. The client accesses the Sheets API directly, so sheet schema stability and browser OAuth handling are critical. |
| D-004 | Abstract storage behind `SheetsStore` | Implemented | `Tracker` can operate against remote Sheets or local demo data without changing domain logic. |
| D-005 | Provide a local demo mode | Implemented | `VITE_DEMO_MODE=true` selects `DemoSheetsRepository`, which seeds and persists data in localStorage. This supports onboarding without cloud configuration. |
| D-006 | Make the spreadsheet schema positional and append-only | Implemented | The repository maps cells by column position. Reordering or deleting columns breaks data mapping; schema changes must append columns and update `SHEETS` and README documentation. |
| D-007 | Store receipt line items in `ReceiptItems`, not transaction remarks | Implemented | Preserves structured receipt data and avoids cell-length truncation. `transactionId` is the association key. |
| D-008 | Cache receipt images in IndexedDB only | Implemented | Avoids putting high-volume base64 images in Sheets. Images do not sync across devices and can be cleared by browser storage policies. |
| D-009 | Use Gemini directly from the browser for optional receipt scanning | Implemented | Avoids a backend but makes the API key client-visible. A restricted, quota-limited key is mandatory; no unrestricted production key should be used. |
| D-010 | Treat duplicate detection as advisory | Implemented | `duplicateGuard` warns on matching type, date, amount, and merchant-like text but does not block legitimate repeated purchases. |
| D-011 | Model bill and maintenance health with pure date/mileage functions | Implemented | `domain.ts` keeps due-state logic testable and reusable. Bill “due soon” is within five days; maintenance can be date- or mileage-driven. |
| D-012 | Keep platform configuration separate from source | Implemented | `.env.example` documents variables; `.env` files must not be committed. Firebase Hosting configuration is versioned in `firebase.json`. |
| D-013 | Validate reachable Git history before publishing | Accepted | Run `git log --all -p` or a dedicated secrets scanner before publishing. If sensitive material is found, remove it from history and rotate affected credentials; cloning alone does not contain a public historical exposure. |
| D-014 | Persist a default payment method on recurring bills | Implemented | `RecurringBills.paymentType` is appended as the final positional column. Bill creation and editing preserve a selected method, defaulting to `Online banking`; marking a bill paid uses that method for the generated expense. Existing sheets are extended during initialization. |

## Open decisions

### OD-001 — Establish automated tests

The domain and repository boundary are suitable for unit tests, but no `test` script or test framework is configured. Decide on the test runner and initial coverage targets before expanding business logic.

### OD-002 — Define data backup and recovery expectations

The Google Sheet is the source of record, but receipt images are browser-local. Define whether image sync, export, retention, and recovery are product requirements.
