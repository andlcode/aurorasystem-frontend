import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Turmas } from "./pages/Turmas";
import { TurmaDetalhe } from "./pages/TurmaDetalhe";
import { Pessoas } from "./pages/Pessoas";
import { SessionChamada } from "./pages/SessionChamada";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/turmas" replace />} />
            <Route path="turmas" element={<Turmas />} />
            <Route path="turmas/:id" element={<TurmaDetalhe />} />
            <Route path="sessions/:sessionId" element={<SessionChamada />} />
            <Route path="pessoas" element={<Pessoas />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
