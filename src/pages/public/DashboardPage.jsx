import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../services/api";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LabelList,
} from "recharts";

import "../../assets/styles/dashboard.css";

// Per-group colour palettes (7 shades, light → dark)
const CAPABILITY_PALETTES = [
  // 0 → A&E+  : Teal/Emerald
  ["#99F6E4","#5EEAD4","#2DD4BF","#14B8A6","#0D9488","#0F766E","#115E59"],
  // 1 → D&A+  : Royal Blue
  ["#BFDBFE","#93C5FD","#60A5FA","#3B82F6","#2563EB","#1D4ED8","#1E40AF"],
  // 2 → FRAL  : Violet/Indigo
  ["#DDD6FE","#C4B5FD","#A78BFA","#8B5CF6","#7C3AED","#6D28D9","#5B21B6"],
  // 3 → Infra : Orange
  ["#FED7AA","#FDBA74","#FB923C","#F97316","#EA580C","#C2410C","#9A3412"],
  // 4 → IRB   : Crimson/Red
  ["#FCA5A5","#F87171","#EF4444","#DC2626","#B91C1C","#991B1B","#7F1D1D"],
  // 5 → Murex : Pink/Fuchsia
  ["#F5D0FE","#F0ABFC","#E879F9","#D946EF","#C026D3","#A21CAF","#86198F"],
  // 6 → Treasury & Markets : Amber/Gold
  ["#FEF3C7","#FDE68A","#FCD34D","#FBBF24","#F59E0B","#D97706","#B45309"],
];

// Fallback single-tone palette for pie/skills charts
const COLORS = ["#6A1B9A","#8E24AA","#AB47BC","#BA68C8","#CE93D8"];

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/data")
      .then((res) => setDashboardData(res.data))
      .catch((err) => console.error("Failed to load dashboard data", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <div className="container py-5 text-center"><p>Loading dashboard data...</p></div>
        <Footer />
      </>
    );
  }

  const weeklyHCTrend        = dashboardData?.weeklyHCTrend        || [];
  const monthlyHCTrend       = dashboardData?.monthlyHCTrend       || [];
  const hcActualData         = dashboardData?.hcActualData         || [];
  const currentHC            = dashboardData?.currentHC            ?? 0;
  const additions            = dashboardData?.additions            ?? 0;
  const leavers              = dashboardData?.leavers              ?? 0;
  const projectedHC          = currentHC + additions - leavers;
  const SBUwisezbillableHC   = dashboardData?.SBUwisezbillableHC   || [];
  const resourceAllocationData = dashboardData?.resourceAllocationData || [];
  const leakageData          = dashboardData?.leakageData          || [];
  const summaryCards         = dashboardData?.summaryCards         || {};

  // ── Group label positions ───────────────────────────────────────────────────
  const groupCounts = Object.entries(
    SBUwisezbillableHC.reduce((acc, item) => {
      acc[item.group] = (acc[item.group] || 0) + 1;
      return acc;
    }, {})
  );

  // ── Per-bar colour map ──────────────────────────────────────────────────────
  const groupToIdx = {};
  let gIdx = 0;
  SBUwisezbillableHC.forEach(item => {
    if (!(item.group in groupToIdx)) groupToIdx[item.group] = gIdx++;
  });

  const groupBars = {};
  SBUwisezbillableHC.forEach(item => {
    if (!groupBars[item.group]) groupBars[item.group] = [];
    groupBars[item.group].push(item.name);
  });

  const barColorMap = {};
  Object.entries(groupBars).forEach(([group, names]) => {
    const palette    = CAPABILITY_PALETTES[groupToIdx[group] % CAPABILITY_PALETTES.length];
    const count      = names.length;
    const usableStart = 2;
    const usableEnd   = palette.length - 2;
    const range       = usableEnd - usableStart;
    const step        = count > 1 ? range / (count - 1) : 0;
    names.forEach((name, pos) => {
      const colorIdx   = Math.round(usableStart + pos * step);
      barColorMap[name] = palette[Math.min(Math.max(colorIdx, usableStart), usableEnd)];
    });
  });

  // ── Capability legend (one swatch per group) ────────────────────────────────
  const capabilityLegend = Object.entries(groupToIdx).map(([name, idx]) => {
    const palette = CAPABILITY_PALETTES[idx % CAPABILITY_PALETTES.length];
    return { name, color: palette[Math.floor(palette.length / 2)] };
  });

  return (
    <>
      <Header />

      {/* Header */}
      <div className="dashboard-header py-4 mb-5">
        <div className="container">
          <h2 className="dashboard-title">📊 Resource Intelligence Dashboard</h2>
          <p className="dashboard-subtitle">
            Workforce Utilization, Allocation, Leakage & Compliance Metrics
          </p>
        </div>
      </div>

      <div className="container">

        {/* Summary Cards */}
        <div className="row mb-4">
          {[
            { value: summaryCards.totalResources    ?? 0,   label: "👥 Total Resources"       },
            { value: `${summaryCards.billableHCPct  ?? 0}%`, label: "⚙️ Billable HC"           },
            { value: summaryCards.leakageHours      ?? 0,   label: "⏱ Leakage Hours"          },
            { value: `${summaryCards.timesheetCompliance ?? 0}%`, label: "📝 Timesheet Compliance" },
          ].map(({ value, label }) => (
            <div className="col-lg-3 col-md-6 mb-3" key={label}>
              <div className="summary-card">
                <h3>{value}</h3>
                <p>{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pricing-page">
          <div className="pricing-title-container">
            <h2>Sub SBU wise Billable HC</h2>
            <p>Dashboard view showing billable headcount distribution, current additions, leavers and actual HC summary.</p>
          </div>

          {/* Row 1 */}
          <div className="top-row">
            <div className="pricing-card">
              <h4>Current Addition / Leavers</h4>
              <div className="summary-row"><span>Current HC</span><strong>{currentHC}</strong></div>
              <div className="summary-row"><span>Additions</span><strong className="positive-value">+{additions}</strong></div>
              <div className="summary-row"><span>Leavers</span><strong className="negative-value">-{leavers}</strong></div>
              <div className="summary-total"><span>Projected HC Month-end</span><strong>{projectedHC}</strong></div>
            </div>

            <div className="pricing-card">
              <h4>HC Actual</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={hcActualData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="value" position="top" fill="#4A148C" fontSize={12} fontWeight="bold" />
                    {hcActualData.map((entry, index) => (
                      <Cell key={`actual-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sub SBU chart with per-group colour coding */}
          <div className="pricing-card sub-sbu-chart-card">
            <h4>Sub SBU wise Billable HC</h4>

            {/* Capability legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
              {capabilityLegend.map(({ name, color }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 3, background: color, display: "inline-block" }} />
                  {name}
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={SBUwisezbillableHC} margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-90} textAnchor="end" height={130} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="value" position="top" fill="#4A148C" fontSize={11} fontWeight="bold" />
                  {SBUwisezbillableHC.map((entry, index) => (
                    <Cell key={`subsbu-${index}`} fill={barColorMap[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Group colour label strip */}
            <div className="sub-sbu-groups">
              {groupCounts.map(([groupName, count], i) => {
                const idx     = groupToIdx[groupName] ?? i;
                const palette = CAPABILITY_PALETTES[idx % CAPABILITY_PALETTES.length];
                const groupColor = palette[Math.floor(palette.length / 2)];
                return (
                  <div key={groupName} className="sbu-group"
                    style={{ flex: count, borderTop: `4px solid ${groupColor}` }}>
                    <span>{groupName}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Skills Matrix + Proficiency */}
        <div className="row mb-4">
          <div className="col-lg-8 mb-4">
            <div className="graph-card">
              <h5>Skills Matrix</h5>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={resourceAllocationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="allocated" fill="#6A1B9A" name="Allocated" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="actual"    fill="#CE93D8" name="Actual"    radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-lg-4 mb-4">
            <div className="graph-card">
              <h5>Prof</h5>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={leakageData} dataKey="value" cx="50%" cy="50%" outerRadius={120} label>
                    {leakageData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      <Footer />
    </>
  );
}

export default DashboardPage;
