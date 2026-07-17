import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, firebaseConfigurationError, googleProvider } from "./firebase";

const TOKEN_KEY = "paytrack.sheetsAccessToken";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  sheetsAccessToken: string | null;
  configurationError: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Provides the Firebase session and the short-lived Google Sheets OAuth token. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetsAccessToken, setSheetsAccessToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    return onAuthStateChanged(auth, (nextUser) => { setUser(nextUser); setLoading(false); });
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    sheetsAccessToken,
    configurationError: firebaseConfigurationError,
    signIn: async () => {
      if (!auth) throw new Error(firebaseConfigurationError ?? "Firebase is unavailable.");
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) throw new Error("Google Sheets access was not granted. Please try signing in again.");
      sessionStorage.setItem(TOKEN_KEY, credential.accessToken);
      setSheetsAccessToken(credential.accessToken);
    },
    signOut: async () => {
      sessionStorage.removeItem(TOKEN_KEY);
      setSheetsAccessToken(null);
      if (auth) await firebaseSignOut(auth);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Reads the authenticated owner session. */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
