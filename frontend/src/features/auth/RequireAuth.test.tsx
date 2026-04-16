import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./RequireAuth";

vi.mock("./AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "./AuthContext";

describe("RequireAuth", () => {
  it("redirects to login when token is missing", () => {
    vi.mocked(useAuth).mockReturnValue({
      token: null,
      user: null,
      isLoading: false,
      login: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/dashboard/customers"]}>
        <Routes>
          <Route
            path="/dashboard/customers"
            element={
              <RequireAuth>
                <div>Private Page</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
