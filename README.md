# PayTrack 💰

PayTrack is a simple, personal finance web app that saves all your money transactions directly inside your own **Google Sheet** (so you completely own your data).

---

## 📋 What You Need Before Starting

Before doing anything, make sure you have:
1. **Node.js** installed on your computer. (Download it from [nodejs.org](https://nodejs.org/) if you don't have it).
2. A **Google Account** (Gmail) to store your financial data.

---

## ⚡ Option 1: Instant Demo Mode (No Setup Required)

If you just want to test the app on your computer immediately without setting up Firebase or Google Sheets:

### Step 1: Open Terminal / Command Prompt
Open terminal inside the project folder (`PayTrack`) and run:
```bash
npm install
```
*(This installs all required packages needed to run the app).*

### Step 2: Create Environment File
Run this command in your terminal to create your configuration file:
```bash
cp .env.example .env
```
*(If you are using Windows Command Prompt instead of terminal, type `copy .env.example .env`)*.

### Step 3: Run the App
Run this command:
```bash
npm run dev
```
Click or open `http://localhost:5173` in your browser.  
🎉 **Done!** You can start testing the app immediately in Demo Mode.

---

## 🔒 Option 2: Full Setup (Connecting your real Google Sheet)

Follow these easy step-by-step instructions to save all your data to your private Google Sheet.

---

### Step 1: Create a Free Firebase Project

1. Go to the **[Firebase Console](https://console.firebase.google.com/)** and log in with your Google account.
2. Click **Create a project** (or **Add project**).
3. Type a name (e.g. `My PayTrack`) and click **Continue** until your project is ready.

---

### Step 2: Turn On Google Sign-In

1. In your Firebase sidebar on the left, click **Build → Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click on **Google**.
4. Toggle **Enable** to ON, pick your email address as the support email, and click **Save**.

---

### Step 3: Register Your Web App & Get Keys

1. Click the **⚙️ Settings Gear icon** (top left near Project Overview) → select **Project settings**.
2. Scroll down to **Your apps** and click the **Web icon (`</>`)**.
3. Enter app nickname `PayTrack` and click **Register app**.
4. You will see a box titled `firebaseConfig` containing code like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "my-paytrack.firebaseapp.com",
     projectId: "my-paytrack",
     storageBucket: "my-paytrack.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
5. Keep this browser tab open! You will copy these values into your `.env` file in the next step.

---

### Step 4: Configure Your `.env` File

Open the `.env` file in your project code editor (or create one by copying `.env.example`), and paste your values matching each line:

```env
VITE_FIREBASE_API_KEY=AIzaSy... (copy your apiKey value)
VITE_FIREBASE_AUTH_DOMAIN=my-paytrack.firebaseapp.com (copy authDomain)
VITE_FIREBASE_PROJECT_ID=my-paytrack (copy projectId)
VITE_FIREBASE_STORAGE_BUCKET=my-paytrack.appspot.com (copy storageBucket)
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789 (copy messagingSenderId)
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef (copy appId)
VITE_DEMO_MODE=false
```
*(Make sure to set `VITE_DEMO_MODE=false` so the app connects to your real Google Sheet!)*

---

### Step 5: Create a Blank Google Sheet & Connect

1. Open your browser and go to **[sheets.new](https://sheets.new)** to create a brand new blank Google Sheet.
2. Copy the URL link of your new sheet from your browser address bar (e.g., `https://docs.google.com/spreadsheets/d/1abcXYZ.../edit`).
3. Start your app server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.
5. Click **Sign in with Google** and log in.
6. When prompted on screen, paste your Google Sheet link into the box and click **Connect and initialize**.

🎉 **Congratulations!** PayTrack will automatically create your database tabs (`Transactions`, `RecurringBills`, `Budgets`, etc.) inside your Google Sheet. Every time you log an expense, it will save directly to your sheet!

---

## 💻 Commands Summary

| Command | What it does |
| :--- | :--- |
| `npm install` | Installs all packages needed to run PayTrack |
| `npm run dev` | Starts the app on your computer (`http://localhost:5173`) |
| `npm run build` | Builds the project for production deployment |

---

## ❤️ Support & Donations

If you find PayTrack helpful and would like to support its development, consider buying me a coffee!

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/fixito)

