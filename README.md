# PayTrack 💰

A single-user personal finance tracker built with **React + Vite** (frontend) and **Firebase Auth + Google Sheets API** (backend storage).

---

## 🚀 Quick Setup Guide

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

---

### 2. Clone & Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd PayTrack

# Install frontend dependencies
npm install
```

---

### 3. Option A: Demo Mode (Quickest)

For instant local testing without Firebase configuration:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Ensure `VITE_DEMO_MODE=true` is set inside `.env`.
3. Start local server:
   ```bash
   npm run dev
   ```

---

### 4. Option B: Full Setup (Firebase & Google Sheets)

Follow these steps to connect your live Google Sheet database:

#### Step 1: Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Under **Build → Authentication**, enable **Google Sign-In**.
3. Under **Project Settings → General**, register a new **Web App** (`</>`) and copy its SDK config.

#### Step 2: Configure Environment Credentials
Open `.env` and paste your Firebase credentials, then disable demo mode:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_DEMO_MODE=false
```

#### Step 3: Create & Connect Your Google Sheet
1. Open [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. Start the app locally:
   ```bash
   npm run dev
   ```
3. Sign in with your Google account.
4. When prompted, paste the URL of your new Google Sheet and click **Connect and initialize**.

---

### 5. Production Build

To run TypeScript verification and output a production bundle:

```bash
npm run build
```

---

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Vite, Framer Motion
- **Backend / Storage**: Firebase Auth, Google Sheets API v4
- **Architecture**: MVVM (Model–View–ViewModel)
