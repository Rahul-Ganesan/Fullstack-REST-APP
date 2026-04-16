import { Navigate, Route, Routes } from "react-router-dom";

import { DashboardLayout } from "./components/DashboardLayout";
import { AnalyticsPage } from "./features/analytics/AnalyticsPage";
import { LoginPage } from "./features/auth/LoginPage";
import { RequireAuth } from "./features/auth/RequireAuth";
import { CustomersPage } from "./features/customers/CustomersPage";
import { UsersPage } from "./features/users/UsersPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard/customers" replace />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
