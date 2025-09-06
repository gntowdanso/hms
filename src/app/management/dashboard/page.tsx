"use client";
import React, { useEffect, useMemo, useState } from "react";
import SidebarMenu from "@/components/SidebarMenu";
import LogoutButton from "@/components/LogoutButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch } from "@/utils/apiFetch";
import { FaUserInjured, FaStethoscope, FaUserNurse, FaBed, FaCalendarCheck, FaFlask, FaPills, FaFileInvoiceDollar, FaMoneyBillWave, FaChartPie, FaPlus, FaNotesMedical, FaReceipt } from "react-icons/fa";

type AnyRec = Record<string, any>;

const numberFmt = (n: number) => new Intl.NumberFormat().format(n);
const currencyFmt = (n: number) => new Intl.NumberFormat('en-GH', { style: "currency", currency: "GHS" }).format(n);

const Card: React.FC<{ title: string; value: string; icon: React.ReactNode; accent?: string; sub?: string }> = ({ title, value, icon, accent = "bg-blue-100 text-blue-700", sub }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${accent}`}>{icon}</div>
    <div className="flex-1">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <section className="mb-8">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {action}
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">{children}</div>
  </section>
);

// Lightweight SVG charts to avoid extra dependencies
const AreaChart: React.FC<{ width?: number; height?: number; series: { label: string; color: string; values: number[] }[]; labels: string[] }>
  = ({ width = 600, height = 220, series, labels }) => {
  const padding = { l: 36, r: 10, t: 10, b: 24 };
  const w = width - padding.l - padding.r;
  const h = height - padding.t - padding.b;
  const maxVal = Math.max(1, ...series.flatMap(s => s.values));
  const stepX = labels.length > 1 ? w / (labels.length - 1) : w;
  const toPath = (vals: number[]) => vals.map((v, i) => {
    const x = padding.l + i * stepX;
    const y = padding.t + (1 - v / maxVal) * h;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="w-full h-auto">
      {/* Axes */}
      <line x1={padding.l} y1={padding.t + h} x2={padding.l + w} y2={padding.t + h} stroke="#e5e7eb" />
      <line x1={padding.l} y1={padding.t} x2={padding.l} y2={padding.t + h} stroke="#e5e7eb" />
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((p) => (
        <line key={p} x1={padding.l} y1={padding.t + p * h} x2={padding.l + w} y2={padding.t + p * h} stroke="#f3f4f6" />
      ))}
      {/* Series */}
      {series.map((s, idx) => {
        const path = toPath(s.values);
        const area = `${path} L ${padding.l + w} ${padding.t + h} L ${padding.l} ${padding.t + h} Z`;
        return (
          <g key={idx}>
            <path d={area} fill={s.color + '33'} stroke="none" />
            <path d={path} fill="none" stroke={s.color} strokeWidth={2} />
          </g>
        );
      })}
      {/* X labels */}
      {labels.map((lb, i) => (
        <text key={i} x={padding.l + i * stepX} y={padding.t + h + 16} textAnchor="middle" className="fill-gray-400 text-[10px]">{lb}</text>
      ))}
      {/* Y max label */}
      <text x={0} y={padding.t + 10} className="fill-gray-400 text-[10px]">{maxVal}</text>
    </svg>
  );
};

const PieChart: React.FC<{ size?: number; data: { label: string; value: number; color: string }[] }>
  = ({ size = 220, data }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -Math.PI / 2; // start at top
  const r = size / 2; const cx = r; const cy = r;
  const toArc = (v: number) => {
    const slice = (v / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const end = angle + slice;
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = slice > Math.PI ? 1 : 0;
    angle = end;
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  };
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="shrink-0">
        {data.map((d, i) => {
          const arc = toArc(d.value);
          return <path key={i} d={arc.d} fill={d.color} stroke="#fff" strokeWidth={1} />;
        })}
      </svg>
      <div className="text-sm text-gray-600">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span className="inline-block w-3 h-3 rounded" style={{ background: d.color }} />
            <span>{d.label}</span>
            <span className="ml-auto font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ManagementDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<{
    patients: AnyRec[];
    doctors: AnyRec[];
    nurses: AnyRec[];
    admissions: AnyRec[];
    appointments: AnyRec[];
    labRequests: AnyRec[];
    medicines: AnyRec[];
    invoices: AnyRec[];
    payments: AnyRec[];
    expenses: AnyRec[];
  }>({ patients: [], doctors: [], nurses: [], admissions: [], appointments: [], labRequests: [], medicines: [], invoices: [], payments: [], expenses: [] });

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        // Fetch in parallel; tolerate individual failures
        const endpoints = [
          "/api/patients",
          "/api/doctors",
          "/api/nurses",
          "/api/admissions",
          "/api/appointments",
          "/api/labrequests",
          "/api/medicines",
          "/api/invoices",
          "/api/payments",
          "/api/expenses",
        ];
        const resps = await Promise.all(
          endpoints.map((ep) => fetch(ep).then((r) => (r.ok ? r.json().catch(() => []) : [] as AnyRec[])).catch(() => []))
        );
        const [patients, doctors, nurses, admissions, appointments, labRequests, medicines, invoices, payments, expenses] = resps as AnyRec[][];
        setData({ patients, doctors, nurses, admissions, appointments, labRequests, medicines, invoices, payments, expenses });
      } catch (e: any) {
        setErr("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const today = new Date();
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

  const stats = useMemo(() => {
    const totalPatients = data.patients.length;
    const totalDoctors = data.doctors.length;
    const totalNurses = data.nurses.length;
    const activeAdmissions = data.admissions.filter((a) => !a.dischargeDate).length;
    const apptsToday = data.appointments.filter((a) => a.appointmentDate && isSameDay(new Date(a.appointmentDate), today)).length;
    const pendingLab = data.labRequests.filter((lr) => {
      const s = String(lr.status || "").toLowerCase();
      return s.includes("pend") || s === ""; // best-effort if status not standardized
    }).length;
    const lowStock = data.medicines.filter((m) => (m.quantityAvailable ?? 0) <= 10).length;
    const outstanding = data.invoices.filter((i) => String(i.status || "").toLowerCase() !== "paid");
    const outstandingTotal = outstanding.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const paymentsToday = data.payments.filter((p) => p.paymentDate && isSameDay(new Date(p.paymentDate), today));
    const paymentsTodaySum = paymentsToday.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
    const expensesThisMonth = data.expenses.filter((e) => e.date && isSameMonth(new Date(e.date), today));
    const expensesThisMonthSum = expensesThisMonth.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return {
      totalPatients,
      totalDoctors,
      totalNurses,
      activeAdmissions,
      apptsToday,
      pendingLab,
      lowStock,
      outstandingTotal,
      paymentsTodaySum,
      expensesThisMonthSum,
    };
  }, [data, today]);

  // Time series for last 14 days: payments vs expenses
  const trend = useMemo(() => {
    const days = 14;
    const labels: string[] = [];
    const payments: number[] = []; const expenses: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      const pSum = data.payments.filter(p => p.paymentDate && new Date(p.paymentDate).toISOString().slice(0,10) === key)
        .reduce((s, p) => s + Number(p.amountPaid || 0), 0);
      const eSum = data.expenses.filter(e => e.date && new Date(e.date).toISOString().slice(0,10) === key)
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      payments.push(pSum);
      expenses.push(eSum);
    }
    return { labels, payments, expenses };
  }, [data.payments, data.expenses, today]);

  // Invoice status breakdown for pie chart
  const invoicePie = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const inv of data.invoices) {
      const s = String(inv.status || 'Unknown');
      groups[s] = (groups[s] || 0) + 1;
    }
    const entries = Object.entries(groups).sort((a,b) => b[1]-a[1]);
    const palette = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#fb7185"];
    return entries.map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }));
  }, [data.invoices]);

  // Quick action - inline expense form
  const [qaExpense, setQaExpense] = useState({ category: "", amount: "", date: new Date().toISOString().slice(0,10), approvedBy: "" });
  const [qaBusy, setQaBusy] = useState(false);
  const submitQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaExpense.category.trim() || !qaExpense.amount || Number(qaExpense.amount) <= 0 || !qaExpense.date || !qaExpense.approvedBy.trim()) return;
    try {
      setQaBusy(true);
      const payload = { ...qaExpense, amount: Number(qaExpense.amount), date: new Date(qaExpense.date).toISOString() } as AnyRec;
      const res = await apiFetch("/api/expenses", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) {
        // refresh some stats
        setQaExpense({ category: "", amount: "", date: new Date().toISOString().slice(0,10), approvedBy: "" });
        // soft refresh payments/expenses list
        const ex = await fetch("/api/expenses").then(r => r.ok ? r.json().catch(()=>[]) : []);
        setData(prev => ({ ...prev, expenses: Array.isArray(ex) ? ex : prev.expenses }));
      }
    } finally {
      setQaBusy(false);
    }
  };

  const recentAdmissions = useMemo(() => {
    return [...data.admissions]
      .sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime())
      .slice(0, 5);
  }, [data.admissions]);
  const recentInvoices = useMemo(() => {
    return [...data.invoices]
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      .slice(0, 5);
  }, [data.invoices]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-6 md:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Hospital Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of patients, clinical operations, lab, pharmacy, and finance.</p>
          </div>
          <div className="flex items-center gap-3">
            <LogoutButton />
          </div>
        </div>

        {loading && (
          <div className="py-10 flex justify-center"><LoadingSpinner /></div>
        )}
        {err && !loading && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-100">{err}</div>
        )}

        {!loading && (
          <>
            {/* Top KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <Card title="Patients" value={numberFmt(stats.totalPatients)} icon={<FaUserInjured />} accent="bg-indigo-100 text-indigo-700" />
              <Card title="Doctors" value={numberFmt(stats.totalDoctors)} icon={<FaStethoscope />} accent="bg-emerald-100 text-emerald-700" />
              <Card title="Nurses" value={numberFmt(stats.totalNurses)} icon={<FaUserNurse />} accent="bg-sky-100 text-sky-700" />
              <Card title="Active Admissions" value={numberFmt(stats.activeAdmissions)} icon={<FaBed />} accent="bg-amber-100 text-amber-700" />
            </div>

            {/* Operations snapshot + charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <div className="lg:col-span-2">
                <Section title="Clinical Overview" action={<a href="/patient/appointments" className="text-sm text-blue-600 hover:underline">View details</a>}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card title="Appointments Today" value={numberFmt(stats.apptsToday)} icon={<FaCalendarCheck />} />
                    <Card title="Pending Lab Requests" value={numberFmt(stats.pendingLab)} icon={<FaFlask />} accent="bg-purple-100 text-purple-700" />
                    <Card title="Low Stock Medicines" value={numberFmt(stats.lowStock)} icon={<FaPills />} accent="bg-rose-100 text-rose-700" />
                  </div>
                </Section>

                <Section title="Payments vs Expenses (14 days)" action={<a href="/finance/expenses" className="text-sm text-blue-600 hover:underline">Finance</a>}>
                  <AreaChart
                    labels={trend.labels}
                    series={[
                      { label: "Payments", color: "#10b981", values: trend.payments },
                      { label: "Expenses", color: "#ef4444", values: trend.expenses },
                    ]}
                  />
                  <div className="mt-2 text-xs text-gray-500 flex gap-4">
                    <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ background: "#10b981" }} /> Payments</span>
                    <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ background: "#ef4444" }} /> Expenses</span>
                  </div>
                </Section>
              </div>
              <div>
                <Section title="Finance Overview" action={<a href="/finance/billing" className="text-sm text-blue-600 hover:underline">View details</a>}>
                  <div className="grid grid-cols-1 gap-4">
                    <Card title="Outstanding Invoices" value={currencyFmt(stats.outstandingTotal)} icon={<FaFileInvoiceDollar />} accent="bg-orange-100 text-orange-700" />
                    <Card title="Payments Today" value={currencyFmt(stats.paymentsTodaySum)} icon={<FaMoneyBillWave />} accent="bg-green-100 text-green-700" />
                    <Card title="Expenses This Month" value={currencyFmt(stats.expensesThisMonthSum)} icon={<FaChartPie />} accent="bg-gray-100 text-gray-700" />
                  </div>
                </Section>

                <Section title="Invoice Status Breakdown">
                  {invoicePie.length > 0 ? (
                    <PieChart data={invoicePie} />
                  ) : (
                    <div className="text-sm text-gray-400">No invoices yet</div>
                  )}
                </Section>
              </div>
            </div>

            {/* Recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Recent Admissions" action={<a href="/patient/admissions" className="text-sm text-blue-600 hover:underline">All admissions</a>}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-3">Patient ID</th>
                        <th className="py-2 pr-3">Ward</th>
                        <th className="py-2 pr-3">Room</th>
                        <th className="py-2 pr-3">Admitted</th>
                        <th className="py-2 pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAdmissions.map((a, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2 pr-3">{a.patientId ?? "-"}</td>
                          <td className="py-2 pr-3">{a.wardId ?? "-"}</td>
                          <td className="py-2 pr-3">{a.roomId ?? "-"}</td>
                          <td className="py-2 pr-3">{a.admissionDate ? new Date(a.admissionDate).toLocaleString() : "-"}</td>
                          <td className="py-2 pr-3">{a.status ?? "-"}</td>
                        </tr>
                      ))}
                      {recentAdmissions.length === 0 && (
                        <tr><td colSpan={5} className="py-4 text-center text-gray-400">No recent admissions</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="Recent Invoices" action={<a href="/finance/invoices" className="text-sm text-blue-600 hover:underline">All invoices</a>}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-3">Invoice #</th>
                        <th className="py-2 pr-3">Billing ID</th>
                        <th className="py-2 pr-3">Issued</th>
                        <th className="py-2 pr-3">Amount</th>
                        <th className="py-2 pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b last:border-0">
                          <td className="py-2 pr-3">{inv.id}</td>
                          <td className="py-2 pr-3">{inv.billingId}</td>
                          <td className="py-2 pr-3">{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : "-"}</td>
                          <td className="py-2 pr-3">{currencyFmt(Number(inv.amount || 0))}</td>
                          <td className="py-2 pr-3">{inv.status ?? "-"}</td>
                        </tr>
                      ))}
                      {recentInvoices.length === 0 && (
                        <tr><td colSpan={5} className="py-4 text-center text-gray-400">No recent invoices</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>

            {/* Quick Actions */}
            <Section title="Quick Actions">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <a href="/patient/admissions" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded">
                    <FaBed /> Admit Patient
                  </a>
                  <a href="/patient/appointments" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded">
                    <FaNotesMedical /> New Appointment
                  </a>
                  <a href="/lab/requests" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded">
                    <FaFlask /> New Lab Request
                  </a>
                </div>
                <div className="space-y-3">
                  <a href="/finance/invoices" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded">
                    <FaReceipt /> Create Invoice
                  </a>
                  <a href="/finance/payments" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded">
                    <FaMoneyBillWave /> Record Payment
                  </a>
                  <a href="/pharmacy/medicines" className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded">
                    <FaPills /> Manage Medicines
                  </a>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Log Expense (quick)</div>
                  <form onSubmit={submitQuickExpense} className="grid grid-cols-2 gap-2">
                    <input value={qaExpense.category} onChange={e=>setQaExpense(v=>({ ...v, category: e.target.value }))} placeholder="Category" className="border p-2 rounded col-span-2" />
                    <input type="number" step="0.01" value={qaExpense.amount} onChange={e=>setQaExpense(v=>({ ...v, amount: e.target.value }))} placeholder="Amount" className="border p-2 rounded" />
                    <input type="date" value={qaExpense.date} onChange={e=>setQaExpense(v=>({ ...v, date: e.target.value }))} className="border p-2 rounded" />
                    <input value={qaExpense.approvedBy} onChange={e=>setQaExpense(v=>({ ...v, approvedBy: e.target.value }))} placeholder="Approved by" className="border p-2 rounded col-span-2" />
                    <button disabled={qaBusy} className="col-span-2 bg-gray-900 text-white px-3 py-2 rounded inline-flex items-center justify-center gap-2 disabled:opacity-60">
                      <FaPlus /> {qaBusy ? 'Saving...' : 'Save Expense'}
                    </button>
                  </form>
                </div>
              </div>
            </Section>
          </>
        )}
      </main>
    </div>
  );
};

export default ManagementDashboardPage;
