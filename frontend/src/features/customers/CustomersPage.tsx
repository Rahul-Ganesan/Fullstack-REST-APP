import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "../../api/client";
import { useAuth } from "../auth/AuthContext";

interface Customer {
  id: number;
  name: string;
  email: string;
  country: string;
  lifecycleStage: string;
  createdAt: string;
}

interface CustomersResponse {
  items: Customer[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const sortByOptions = ["createdAt", "name", "email", "country", "lifecycleStage"] as const;
type SortBy = (typeof sortByOptions)[number];

export function CustomersPage() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [country, setCountry] = useState("");
  const [lifecycleStage, setLifecycleStage] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortDir,
    });
    if (country) {
      params.set("country", country);
    }
    if (lifecycleStage) {
      params.set("lifecycleStage", lifecycleStage);
    }
    return params.toString();
  }, [page, limit, sortBy, sortDir, country, lifecycleStage]);

  const query = useQuery({
    queryKey: ["customers", queryString],
    queryFn: () => apiRequest<CustomersResponse>(`/customers?${queryString}`, {}, token ?? undefined),
  });

  return (
    <section>
      <header className="page-header">
        <h1>Customers</h1>
        <p className="muted">Filter and segment your customer base.</p>
      </header>

      <div className="card filter-grid">
        <label>
          Country
          <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="US" />
        </label>
        <label>
          Lifecycle stage
          <input
            value={lifecycleStage}
            onChange={(event) => setLifecycleStage(event.target.value)}
            placeholder="growth"
          />
        </label>
        <label>
          Sort by
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
            {sortByOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort direction
          <select value={sortDir} onChange={(event) => setSortDir(event.target.value as "asc" | "desc")}>
            <option value="asc">asc</option>
            <option value="desc">desc</option>
          </select>
        </label>
        <label>
          Page size
          <select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      {query.isLoading ? <p className="page-status">Loading customers...</p> : null}
      {query.isError ? <p className="error-text">{query.error.message}</p> : null}

      {!query.isLoading && query.data ? (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Country</th>
                <th>Lifecycle stage</th>
                <th>Created at</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.length === 0 ? (
                <tr>
                  <td colSpan={5}>No customers matched your filters.</td>
                </tr>
              ) : (
                query.data.items.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.country}</td>
                    <td>{customer.lifecycleStage}</td>
                    <td>{new Date(customer.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pagination-row">
            <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
              Previous
            </button>
            <span>
              Page {query.data.page} of {Math.max(1, query.data.totalPages)} ({query.data.total} total)
            </span>
            <button
              onClick={() => setPage((value) => value + 1)}
              disabled={query.data.page >= query.data.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
