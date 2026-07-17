import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "./model/AuthContext";
import { useTrackerViewModel } from "./viewModels/useTrackerViewModel";
import type { TransactionType } from "./model/types";

type Page = "dashboard" | "transactions" | "budgets" | "bills" | "maintenance" | "history";
const today = (): string => new Date().toISOString().slice(0, 10);
const currency = (value: number): string => `RM${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Root view; page state and mutations remain in ViewModels and the Tracker model. */
export default function App() {
  const { user, loading: authLoading, sheetsAccessToken, signIn, signOut } = useAuth();
  const vm = useTrackerViewModel(sheetsAccessToken);
  const [page, setPage] = useState<Page>("dashboard");
  const [sheetLink, setSheetLink] = useState("");
  const [initializing, setInitializing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function connect(event: FormEvent) { event.preventDefault(); setInitializing(true); setActionError(null); try { await vm.connect(sheetLink, true); } catch (reason) { setActionError(reason instanceof Error ? reason.message : "Unable to connect sheet."); } finally { setInitializing(false); } }
  async function run(action: () => Promise<void>) { setActionError(null); try { await action(); await vm.reload(); } catch (reason) { setActionError(reason instanceof Error ? reason.message : "Action failed."); } }

  if (authLoading) return <main>Loading…</main>;
  if (!user) return <main className="auth"><h1>PayTrack</h1><p>Your private Google Sheet is your database.</p><button onClick={() => void signIn()}>Sign in with Google</button></main>;
  if (!sheetsAccessToken) return <main className="auth"><h1>Sheets access needed</h1><p>Sign in again and approve Google Sheets access to connect your private workbook.</p><button onClick={() => void signIn()}>Grant Sheets access</button><button className="secondary" onClick={() => void signOut()}>Sign out</button></main>;
  if (!vm.spreadsheetId) return <main className="auth"><h1>Connect your private Sheet</h1><p>Create a blank Google Sheet owned by {user.email}, paste its link below, then initialize its PayTrack tabs.</p><form onSubmit={connect}><input aria-label="Google Sheets link" value={sheetLink} onChange={(event) => setSheetLink(event.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." required /><button disabled={initializing}>{initializing ? "Initializing…" : "Connect and initialize"}</button></form>{actionError && <p className="error">{actionError}</p>}</main>;

  return <div className="shell"><aside><h1>PayTrack</h1>{(["dashboard", "transactions", "budgets", "bills", "maintenance", "history"] as Page[]).map((item) => <button className={page === item ? "active" : ""} onClick={() => setPage(item)} key={item}>{item}</button>)}<small>{user.email}</small><button className="secondary" onClick={vm.disconnect}>Disconnect sheet</button><button className="secondary" onClick={() => void signOut()}>Sign out</button></aside><main>{actionError && <p className="error">{actionError}</p>}{vm.loading && <p>Loading…</p>}{vm.error && <p className="error">{vm.error}</p>}{vm.data && <TrackerPage page={page} data={vm.data} run={run} tracker={vm.tracker!} />}</main></div>;
}

function TrackerPage({ page, data, run, tracker }: { page: Page; data: NonNullable<ReturnType<typeof useTrackerViewModel>["data"]>; run: (action: () => Promise<void>) => Promise<void>; tracker: NonNullable<ReturnType<typeof useTrackerViewModel>["tracker"]> }) {
  if (page === "dashboard") return <Dashboard data={data} run={run} tracker={tracker} />;
  if (page === "transactions") return <Transactions data={data} run={run} tracker={tracker} />;
  if (page === "budgets") return <Budgets data={data} run={run} tracker={tracker} />;
  if (page === "bills") return <Bills data={data} run={run} tracker={tracker} />;
  if (page === "maintenance") return <Maintenance data={data} run={run} tracker={tracker} />;
  return <History data={data} run={run} tracker={tracker} />;
}

function Dashboard({ data, run, tracker }: Props) { return <><h2>Dashboard — {data.dashboard.month}</h2><div className="stats"><Stat label="Income" value={data.dashboard.totalIncome}/><Stat label="Expense" value={data.dashboard.totalExpense}/><Stat label="Net" value={data.dashboard.netAmount}/></div><h3>Budgets</h3>{data.dashboard.budgets.map((budget) => <p key={budget.category}>{budget.category}: {currency(budget.spent)} / {currency(budget.monthlyLimit)}</p>)}<h3>Bills needing attention</h3>{data.bills.filter((bill) => bill.status === "overdue" || bill.status === "due_soon").map((bill) => <p key={bill.bill.id}>{bill.bill.name} — {bill.status} <button onClick={() => void run(() => tracker.markBillPaid(bill.bill.id))}>Mark paid</button></p>)}</> }
function Stat({ label, value }: { label: string; value: number }) { return <section><strong>{currency(value)}</strong><span>{label}</span></section>; }

type Props = { data: NonNullable<ReturnType<typeof useTrackerViewModel>["data"]>; run: (action: () => Promise<void>) => Promise<void>; tracker: NonNullable<ReturnType<typeof useTrackerViewModel>["tracker"]> };

function Transactions({ data, run, tracker }: Props) {
  const [type, setType] = useState<TransactionType>("expense"); const [category, setCategory] = useState(""); const [amount, setAmount] = useState(""); const [description, setDescription] = useState(""); const [newCategory, setNewCategory] = useState("");
  return <><h2>Transactions</h2><form onSubmit={(event) => { event.preventDefault(); void run(() => tracker.addTransaction({ date: today(), type, category, amount: Number(amount), description, paymentType: "", remarks: "" })); setAmount(""); setDescription(""); }}><select value={type} onChange={(event) => setType(event.target.value as TransactionType)}><option value="expense">Expense</option><option value="income">Income</option></select><select value={category} onChange={(event) => setCategory(event.target.value)} required><option value="">Category</option>{data.categories.filter((item) => item.type === type).map((item) => <option key={item.id}>{item.name}</option>)}</select><input type="number" min="0" step="0.01" placeholder="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} required/><input placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)}/><button>Add</button></form><form onSubmit={(event) => { event.preventDefault(); void run(() => tracker.addCategory(newCategory, type)); setNewCategory(""); }}><input placeholder="New category" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} required/><button>Add {type} category</button></form>{data.transactions.map((item) => <p key={item.id}>{item.date} · {item.category} · {currency(item.amount)} <button onClick={() => void run(() => tracker.deleteTransaction(item.id))}>Delete</button></p>)}</>;
}

function Budgets({ data, run, tracker }: Props) {
  const [category, setCategory] = useState(""); const [limit, setLimit] = useState("");
  return <><h2>Budgets</h2><form onSubmit={(event) => { event.preventDefault(); void run(() => tracker.setBudget(category, Number(limit))); setLimit(""); }}><select value={category} onChange={(event) => setCategory(event.target.value)} required><option value="">Expense category</option>{data.categories.filter((item) => item.type === "expense").map((item) => <option key={item.id}>{item.name}</option>)}</select><input type="number" min="0" step="0.01" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="Monthly limit" required/><button>Save budget</button></form>{data.budgets.map((item) => <p key={item.id}>{item.category}: {currency(item.monthlyLimit)} <button onClick={() => void run(() => tracker.deleteBudget(item.id))}>Delete</button></p>)}</>;
}

function Bills({ data, run, tracker }: Props) {
  const [name, setName] = useState(""); const [amount, setAmount] = useState(""); const [category, setCategory] = useState(""); const [dueDay, setDueDay] = useState("1");
  return <><h2>Recurring bills</h2><form onSubmit={(event) => { event.preventDefault(); void run(() => tracker.addBill({ name, amount: Number(amount), category, dueDay: Number(dueDay), recurrence: "monthly" })); setName(""); setAmount(""); }}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Bill name" required/><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" required/><select value={category} onChange={(event) => setCategory(event.target.value)} required><option value="">Expense category</option>{data.categories.filter((item) => item.type === "expense").map((item) => <option key={item.id}>{item.name}</option>)}</select><input type="number" min="1" max="31" value={dueDay} onChange={(event) => setDueDay(event.target.value)} title="Day of month"/><button>Add monthly bill</button></form>{data.bills.map((item) => <p key={item.bill.id}>{item.bill.name} · {currency(item.bill.amount)} · {item.status} {!item.isPaidForCurrentPeriod && <button onClick={() => void run(() => tracker.markBillPaid(item.bill.id))}>Mark paid</button>} <button onClick={() => void run(() => tracker.deleteBill(item.bill.id))}>Delete</button></p>)}</>;
}

function Maintenance({ data, run, tracker }: Props) {
  const [mileage, setMileage] = useState(String(data.carInfo.currentMileage || "")); const [name, setName] = useState(""); const [months, setMonths] = useState(""); const [km, setKm] = useState("");
  return <><h2>Car maintenance</h2><form onSubmit={(event) => { event.preventDefault(); void run(() => tracker.setMileage(Number(mileage))); }}><input type="number" min="0" value={mileage} onChange={(event) => setMileage(event.target.value)} placeholder="Current km" required/><button>Update mileage</button></form><form onSubmit={(event) => { event.preventDefault(); void run(() => tracker.addMaintenance({ name, notes: "", intervalMonths: Number(months) || 0, intervalKm: Number(km) || 0, lastServiceDate: today() })); setName(""); }}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Maintenance item" required/><input type="number" min="0" value={months} onChange={(event) => setMonths(event.target.value)} placeholder="Months"/><input type="number" min="0" value={km} onChange={(event) => setKm(event.target.value)} placeholder="Kilometres"/><button>Add item</button></form>{data.maintenance.map((item) => <p key={item.item.id}>{item.item.name} · {item.status} <button onClick={() => void run(() => tracker.markMaintenanceDone(item.item.id))}>Mark done</button> <button onClick={() => void run(() => tracker.deleteMaintenance(item.item.id))}>Delete</button></p>)}</>;
}

function History({ data, run, tracker }: Props) {
  const [mileage, setMileage] = useState(""); const [description, setDescription] = useState("");
  return <><h2>Service history</h2><form onSubmit={(event) => { event.preventDefault(); void run(() => tracker.addServiceRecord(today(), Number(mileage), description)); setMileage(""); setDescription(""); }}><input type="number" min="0" value={mileage} onChange={(event) => setMileage(event.target.value)} placeholder="Odometer" required/><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Work done" required/><button>Add record</button></form>{data.serviceHistory.map((item) => <p key={item.id}>{item.date} · {item.mileage.toLocaleString()} km · {item.description} <button onClick={() => void run(() => tracker.deleteServiceRecord(item.id))}>Delete</button></p>)}</>;
}
