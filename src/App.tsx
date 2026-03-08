import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { DashboardHome } from "./pages/DashboardHome";
import { Turmas } from "./pages/Turmas";
import { TurmaDetalhe } from "./pages/TurmaDetalhe";
import { TurmaNova } from "./pages/TurmaNova";
import { ChamadaTurma } from "./pages/ChamadaTurma";
import { HistoricoTurma } from "./pages/HistoricoTurma";
import { Alunos } from "./pages/Alunos";
import { AlunosNovo } from "./pages/AlunosNovo";
import { Equipe } from "./pages/Equipe";
import { EquipeNovo } from "./pages/EquipeNovo";
import { EquipeEditar } from "./pages/EquipeEditar";
import { RequireSuperAdmin } from "./components/RequireSuperAdmin";
import { SessionChamada } from "./pages/SessionChamada";
import { Estatisticas } from "./pages/Estatisticas";
import { ChamadaRapida } from "./pages/ChamadaRapida";

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
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="estatisticas" element={<Estatisticas />} />
            <Route path="turmas" element={<Turmas />} />
            <Route path="turmas/nova" element={<TurmaNova />} />
            <Route path="turmas/:id" element={<TurmaDetalhe />} />
            <Route path="turmas/:classId/chamada-rapida" element={<ChamadaRapida />} />
            <Route path="turmas/:classId/chamada" element={<ChamadaTurma />} />
            <Route path="turmas/:classId/chamada/:sessionId" element={<ChamadaTurma />} />
            <Route path="turmas/:classId/historico" element={<HistoricoTurma />} />
            <Route path="sessions/:sessionId" element={<SessionChamada />} />
            <Route path="alunos" element={<Alunos />} />
            <Route path="alunos/novo" element={<AlunosNovo />} />
            <Route
              path="equipe"
              element={
                <RequireSuperAdmin>
                  <Equipe />
                </RequireSuperAdmin>
              }
            />
            <Route
              path="equipe/novo"
              element={
                <RequireSuperAdmin>
                  <EquipeNovo />
                </RequireSuperAdmin>
              }
            />
            <Route
              path="equipe/:id/editar"
              element={
                <RequireSuperAdmin>
                  <EquipeEditar />
                </RequireSuperAdmin>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
