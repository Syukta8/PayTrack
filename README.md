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

# Install root & frontend dependencies
npm install
```

---

### 3. Environment Setup

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase Web App configuration credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_DEMO_MODE=true
```

> 💡 **Tip:** Set `VITE_DEMO_MODE=true` for local testing without Firebase / Google Sheets setup.

---

### 4. Running Locally

Start the local development server:

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

---

### 5. Building for Production

To run a TypeScript typecheck and generate the Vite production build:

```bash
npm run build
```

---

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Vite, Framer Motion
- **Backend / Services**: Firebase Authentication, Google Sheets API v4
- **Architecture**: MVVM (Model–View–ViewModel)
