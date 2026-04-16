import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "../../api/client";
import { useAuth } from "../auth/AuthContext";

interface User {
  id: number;
  email: string;
  role: "admin" | "analyst";
  isActive: boolean;
  createdAt: string;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const { token, user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "analyst">("analyst");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users-list"],
    queryFn: () => apiRequest<User[]>("/users", {}, token ?? undefined),
    enabled: user?.role === "admin",
  });

  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; role: "admin" | "analyst" }) =>
      apiRequest<{ inviteToken: string; temporaryPassword: string }>("/users/invite", {
        method: "POST",
        body: JSON.stringify(payload),
      }, token ?? undefined),
    onSuccess: (data) => {
      setInviteToken(data.inviteToken);
      setTemporaryPassword(data.temporaryPassword);
      setInviteEmail("");
      void queryClient.invalidateQueries({ queryKey: ["users-list"] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest(`/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }, token ?? undefined),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users-list"] }),
  });

  const resetMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ resetToken: string }>(`/users/${id}/reset-password`, {
        method: "POST",
      }, token ?? undefined),
    onSuccess: (data) => setResetToken(data.resetToken),
  });

  if (user?.role !== "admin") {
    return <p className="error-text">Only admin users can access user management.</p>;
  }

  function onInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  }

  return (
    <section>
      <header className="page-header">
        <h1>User Management</h1>
        <p className="muted">Invite users, control account status, and issue reset tokens.</p>
      </header>

      <form className="card filter-grid" onSubmit={onInviteSubmit}>
        <label>
          Invite email
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
          />
        </label>
        <label>
          Role
          <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as "admin" | "analyst")}>
            <option value="analyst">analyst</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <div className="inline-actions">
          <button type="submit" disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? "Inviting..." : "Invite user"}
          </button>
        </div>
      </form>

      {temporaryPassword || inviteToken ? (
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            Demo only: copy these once. Activate the user before they can sign in.
          </p>
          {temporaryPassword ? (
            <p>
              <strong>Temporary password:</strong> <code>{temporaryPassword}</code>
            </p>
          ) : null}
          {inviteToken ? (
            <p>
              <strong>Invite token:</strong> <code>{inviteToken}</code>
            </p>
          ) : null}
        </div>
      ) : null}
      {resetToken ? <p className="card">Password reset token (demo mode): {resetToken}</p> : null}
      {usersQuery.isError ? <p className="error-text">{usersQuery.error.message}</p> : null}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(usersQuery.data ?? []).map((item) => (
              <tr key={item.id}>
                <td>{item.email}</td>
                <td>{item.role}</td>
                <td>{item.isActive ? "active" : "inactive"}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td className="inline-actions">
                  <button
                    onClick={() =>
                      toggleStatusMutation.mutate({
                        id: item.id,
                        isActive: !item.isActive,
                      })
                    }
                  >
                    {item.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => resetMutation.mutate(item.id)}>Reset Password</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
