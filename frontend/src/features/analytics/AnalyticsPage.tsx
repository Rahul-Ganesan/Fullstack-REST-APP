import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "../../api/client";
import { useAuth } from "../auth/AuthContext";

interface KpiResponse {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  avgOrderValue: number;
}

interface SegmentItem {
  customerId: number;
  name: string;
  email: string;
  country: string;
  lifecycleStage: string;
  revenue: number;
  eventsCount: number;
}

interface SegmentResponse {
  items: SegmentItem[];
  page: number;
  limit: number;
}

function toIsoDate(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().slice(0, 10);
}

export function AnalyticsPage() {
  const { token } = useAuth();
  const [from, setFrom] = useState(toIsoDate(-30));
  const [to, setTo] = useState(toIsoDate(0));
  const [minRevenue, setMinRevenue] = useState(0);
  const [eventType, setEventType] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      from: `${from}T00:00:00.000Z`,
      to: `${to}T23:59:59.999Z`,
    });
    return params.toString();
  }, [from, to]);

  const segmentQueryString = useMemo(() => {
    const params = new URLSearchParams({
      from: `${from}T00:00:00.000Z`,
      to: `${to}T23:59:59.999Z`,
      minRevenue: String(minRevenue),
      page: "1",
      limit: "20",
    });
    if (eventType) {
      params.set("eventType", eventType);
    }
    return params.toString();
  }, [from, to, minRevenue, eventType]);

  const kpiQuery = useQuery({
    queryKey: ["analytics-kpis", queryString],
    queryFn: () => apiRequest<KpiResponse>(`/analytics/kpis?${queryString}`, {}, token ?? undefined),
  });

  const segmentQuery = useQuery({
    queryKey: ["analytics-segments", segmentQueryString],
    queryFn: () =>
      apiRequest<SegmentResponse>(`/analytics/segments?${segmentQueryString}`, {}, token ?? undefined),
  });

  return (
    <section>
      <header className="page-header">
        <h1>Analytics</h1>
        <p className="muted">Track core KPIs and customer segments.</p>
      </header>

      <div className="card filter-grid">
        <label>
          From
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <label>
          Min revenue
          <input
            type="number"
            value={minRevenue}
            onChange={(event) => setMinRevenue(Number(event.target.value))}
            min={0}
          />
        </label>
        <label>
          Event type (optional)
          <input value={eventType} onChange={(event) => setEventType(event.target.value)} />
        </label>
      </div>

      {kpiQuery.isError ? <p className="error-text">{kpiQuery.error.message}</p> : null}
      <div className="kpi-grid">
        <article className="card kpi-card">
          <h3>Total customers</h3>
          <p>{kpiQuery.data?.totalCustomers ?? "-"}</p>
        </article>
        <article className="card kpi-card">
          <h3>Active customers</h3>
          <p>{kpiQuery.data?.activeCustomers ?? "-"}</p>
        </article>
        <article className="card kpi-card">
          <h3>Total revenue</h3>
          <p>${(kpiQuery.data?.totalRevenue ?? 0).toFixed(2)}</p>
        </article>
        <article className="card kpi-card">
          <h3>Average order value</h3>
          <p>${(kpiQuery.data?.avgOrderValue ?? 0).toFixed(2)}</p>
        </article>
      </div>

      {segmentQuery.isError ? <p className="error-text">{segmentQuery.error.message}</p> : null}
      <div className="card">
        <h2>Segments</h2>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Country</th>
              <th>Stage</th>
              <th>Revenue</th>
              <th>Events</th>
            </tr>
          </thead>
          <tbody>
            {(segmentQuery.data?.items ?? []).map((item) => (
              <tr key={item.customerId}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.country}</td>
                <td>{item.lifecycleStage}</td>
                <td>${item.revenue.toFixed(2)}</td>
                <td>{item.eventsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
