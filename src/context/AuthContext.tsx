import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../types/auth";

interface AuthContextValue {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEYS = { token: "token", user: "user" } as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const stored = localStorage.getItem(STORAGE_KEYS.user);

    if (!token) {
      localStorage.removeItem(STORAGE_KEYS.user);
      setIsReady(true);
      return;
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        if (parsed.userId && parsed.role && parsed.username && parsed.name) {
          setUser(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEYS.token);
          localStorage.removeItem(STORAGE_KEYS.user);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.token);
    }

    setIsReady(true);
  }, []);

  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.token),
        isReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
