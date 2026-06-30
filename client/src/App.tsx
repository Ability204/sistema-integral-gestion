import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UsuariosPage } from "./pages/UsuariosPage";
import { ClientesPage } from "./pages/ClientesPage";
import { NominasPage } from "./pages/NominasPage";
import { ProyectosPage } from "./pages/ProyectosPage";
import { ChatPage } from "./pages/ChatPage";

export function App() {
  const { usuario } = useAuth();

  if (!usuario) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/nominas" element={<NominasPage />} />
        <Route path="/proyectos" element={<ProyectosPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
