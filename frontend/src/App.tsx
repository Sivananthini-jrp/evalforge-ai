// evalforge-ai/frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Layout from './components/layout/layout';
import Dashboard from './pages/Dashboard';
import Datasets from './pages/Datasets';
import NewExperiment from './pages/NewExperiment';
import ExperimentDetail from './pages/ExperimentDetail';
import Compare from './pages/Compare';
import Reports from './pages/Reports';
import Login from './pages/Login';

function ProtectedLayout() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Layout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="datasets" element={<Datasets />} />
          <Route path="experiments/new" element={<NewExperiment />} />
          <Route path="experiments/:id" element={<ExperimentDetail />} />
          <Route path="compare" element={<Compare />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}