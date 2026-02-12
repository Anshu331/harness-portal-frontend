import { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./authContext.jsx";

import Login from "./pages/Login.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import UserManagementPage from "./pages/UserManagementPage.jsx";
import TrackingPage from "./pages/TrackingPage.jsx";
import ProjectVehiclePage from "./pages/ProjectVehiclePage.jsx";
import VendorsPage from "./pages/VendorsPage.jsx";
import StatsDetailPage from "./pages/StatsDetailPage.jsx";
import VendorDashboard from "./pages/VendorDashboard.jsx";
import DVPDashboard from "./pages/DVPDashboard.jsx";
import TNVDashboard from "./pages/TNVDashboard.jsx";

export default function App() {
  const { user } = useContext(AuthContext);

  if (!user) return <Login />;

  if (user === "ADMIN") {
    return (
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="tracking" element={<TrackingPage />} />
          <Route path="projects" element={<ProjectVehiclePage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="stats/:filter" element={<StatsDetailPage />} />
          <Route path="dvp" element={<DVPDashboard />} />
          <Route path="tnv" element={<TNVDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (user === "VENDOR") return <VendorDashboard />;
  if (user === "DVP") return <DVPDashboard />;
  if (user === "TNV") return <TNVDashboard />;
}
