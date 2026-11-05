import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("pocket-ledger-token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    apiRequest("/auth/me", { token })
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem("pocket-ledger-token");
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function authenticate(path, credentials) {
    const result = await apiRequest(path, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    localStorage.setItem("pocket-ledger-token", result.token);
    setUser(result.user);
    setToken(result.token);
  }

  function logout() {
    localStorage.removeItem("pocket-ledger-token");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, loading, login: (body) => authenticate("/auth/login", body), register: (body) => authenticate("/auth/register", body), logout }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
