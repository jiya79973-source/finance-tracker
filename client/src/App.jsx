import AuthPage from "./components/AuthPage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { useAuth } from "./AuthContext.jsx";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-mark">p.</div>
        <p>Getting your finances ready…</p>
      </main>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
}
