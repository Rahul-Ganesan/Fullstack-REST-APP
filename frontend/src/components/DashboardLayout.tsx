import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";

export function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h2>Analytics SaaS</h2>
        <nav>
          <NavLink to="/dashboard/customers">Customers</NavLink>
          <NavLink to="/dashboard/analytics">Analytics</NavLink>
          {user?.role === "admin" ? <NavLink to="/dashboard/users">Users</NavLink> : null}
        </nav>
        <div className="sidebar-footer">
          <p>{user?.email}</p>
          <p className="muted">{user?.role}</p>
          <button onClick={() => void logout()}>Logout</button>
        </div>
      </aside>
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}
