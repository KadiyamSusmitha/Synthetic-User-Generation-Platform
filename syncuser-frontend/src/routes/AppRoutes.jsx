import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ForgotPassword from "../pages/ForgotPassword";
import VerifyOTP from "../pages/VerifyOTP";
import ResetPassword from "../pages/ResetPassword";

import Dashboard from "../pages/Dashboard";
import Experiments from "../pages/Experiments";
import ExperimentDetails from "../pages/ExperimentDetails";
import EditExperiment from "../pages/EditExperiment";
import Personas from "../pages/Personas";
import PersonaDetail from "../pages/PersonaDetail";
import Surveys from "../pages/Surveys";
import CreateSurvey from "../pages/CreateSurvey";
import Interviews from "../pages/Interviews";
import Insights from "../pages/Insights";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";

import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/experiments" element={<Experiments />} />

        <Route
          path="/experiments/:experimentId"
          element={<ExperimentDetails />}
        />

        <Route
          path="/experiments/:experimentId/edit"
          element={<EditExperiment />}
        />

        <Route path="/personas" element={<Personas />} />

        <Route path="/personas/:personaId" element={<PersonaDetail />} />

        <Route path="/surveys" element={<Surveys />} />

        <Route path="/surveys/new" element={<CreateSurvey />} />

        <Route path="/interviews" element={<Interviews />} />

        <Route path="/insights" element={<Insights />} />

        <Route path="/reports" element={<Reports />} />

        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Unknown Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
