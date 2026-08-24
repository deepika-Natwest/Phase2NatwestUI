import React, { useState, useEffect, useMemo } from "react";
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

// Capability groups sort alphabetically: A&E+→0, D&A+→1, FRAL→2, Infra→3, IRB→4, Murex→5, Treasury & Markets→6
// Each palette spans a tight mid-tone range so all bars within a group look clearly the same colour.
const CAPABILITY_PALETTES = [
  // 0 → A&E+              : Teal/Emerald (green — clearly not blue)
  ["#99F6E4","#5EEAD4","#2DD4BF","#14B8A6","#0D9488","#0F766E","#115E59"],
  // 1 → D&A+              : Royal Blue
  ["#BFDBFE","#93C5FD","#60A5FA","#3B82F6","#2563EB","#1D4ED8","#1E40AF"],
  // 2 → FRAL              : Violet/Indigo (Accenture purple family — clearly distinct from blue & green)
  ["#DDD6FE","#C4B5FD","#A78BFA","#8B5CF6","#7C3AED","#6D28D9","#5B21B6"],
  // 3 → Infra             : Orange
  ["#FED7AA","#FDBA74","#FB923C","#F97316","#EA580C","#C2410C","#9A3412"],
  // 4 → IRB               : Crimson/Red
  ["#FCA5A5","#F87171","#EF4444","#DC2626","#B91C1C","#991B1B","#7F1D1D"],
  // 5 → Murex             : Pink/Fuchsia
  ["#F5D0FE","#F0ABFC","#E879F9","#D946EF","#C026D3","#A21CAF","#86198F"],
  // 6 → Treasury & Markets: Amber/Gold (warm yellow — clearly distinct from FRAL violet & D&A+ blue)
  ["#FEF3C7","#FDE68A","#FCD34D","#FBBF24","#F59E0B","#D97706","#B45309"],
];

// Hardcoded fallback (used when API data is unavailable)
const FALLBACK_SBU_DATA = [
  { name: "A&E",                          value: 27, group: "A&E+" },
  { name: "Shared Services",              value: 6,  group: "A&E+" },
  { name: "Bank Of API's",               value: 6,  group: "A&E+" },
  { name: "Wealth CRM",                  value: 5,  group: "A&E+" },
  { name: "D&A",                          value: 46, group: "D&A+" },
  { name: "FinCrime",                     value: 16, group: "D&A+" },
  { name: "C&I",                          value: 4,  group: "D&A+" },
  { name: "Wealth Management",           value: 7,  group: "D&A+" },
  { name: "Retail Banking",              value: 33, group: "D&A+" },
  { name: "Functions",                   value: 6,  group: "D&A+" },
  { name: "Treasury Solutions-BSM",      value: 24, group: "Treasury & Markets" },
  { name: "Treasury Solutions-Climate",  value: 12, group: "Treasury & Markets" },
  { name: "Treasury Solutions-SFP",      value: 32, group: "Treasury & Markets" },
  { name: "Natwest Markets",             value: 38, group: "Treasury & Markets" },
  { name: "NWM-RBSI",                    value: 7,  group: "Treasury & Markets" },
  { name: "Payments",                    value: 3,  group: "Treasury & Markets" },
  { name: "Core Banking",               value: 0,  group: "Treasury & Markets" },
  { name: "NWM-Ops",                     value: 4,  group: "Treasury & Markets" },
  { name: "Market Risk",                 value: 20, group: "Treasury & Markets" },
  { name: "FS-FRAL",                     value: 42, group: "FRAL" },
  { name: "RS-FRAL",                     value: 40, group: "FRAL" },
  { name: "FRAL-Non Consolidated",       value: 16, group: "FRAL" },
  { name: "IRB",                         value: 59, group: "IRB" },
  { name: "Infra",                       value: 72, group: "Infra" },
  { name: "Murex",                       value: 16, group: "Murex" },
];

const COLORS = ["#6A1B9A","#8E24AA","#AB47BC","#BA68C8","#CE93D8"];

const hcActualData = [
  { name: "A&E+",               value: 44  },
  { name: "D&A+",               value: 112 },
  { name: "Treasury & Markets", value: 140 },
  { name: "FRAL",               value: 100 },
  { name: "IRB",                value: 59  },
  { name: "Infra",              value: 72  },
  { name: "Murex",              value: 16  },
];

const resourceAllocationData = [
  { name: "Java",    allocated: 45, actual: 40 },
  { name: "React",   allocated: 32, actual: 28 },
  { name: "Testing", allocated: 25, actual: 22 },
  { name: "Data",    allocated: 18, actual: 16 },
  { name: "DevOps",  allocated: 22, actual: 20 },
];

const leakageData = [
  { name: "Bench",    value: 45 },
  { name: "Learning", value: 22 },
  { name: "Admin",    value: 15 },
  { name: "Leave",    value: 18 },
];

const currentHC  = 543;
const additions  = 31;
const leavers    = 31;
const projectedHC = currentHC + additions - leavers;

function DashboardPage() {
  const [sbuData, setSbuData] = useState(FALLBACK_SBU_DATA);

  // ── Fetch franchises, capabilities, users and build dynamic chart data ──
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // use fallback when not authenticated

    Promise.all([
      api.get("/franchises"),
      api.get("/capabilities"),
      api.get("/users?limit=10000"),
    ])
      .then(([frRes, capRes, usersRes]) => {
        const allFranchises   = Array.isArray(frRes.data)  ? frRes.data  : [];
        const allCapabilities = Array.isArray(capRes.data) ? capRes.data : [];
        const rawUsers        = usersRes.data?.users || usersRes.data || [];

        if (!allFranchises.length) return;

        // Build capability lookup: id → name, lower-name → name
        const capById        = {};
        const capByNameLower = {};
        allCapabilities.forEach((c) => {
          capById[c.id]                        = c.name;
          capByNameLower[c.name?.toLowerCase()] = c.name;
        });
        const resolveCapName = (val) =>
          capById[val] ||
          capByNameLower[val?.toLowerCase()] ||
          val ||
          "Unknown";

        // Count billable HC per franchiseId (supports UUID or text storage)
        const billableUsers = rawUsers.filter(
          (u) => u.role?.toUpperCase() !== "ADMIN"
        );
        const countById        = {};
        const countByNameLower = {};
        billableUsers.forEach((u) => {
          if (!u.franchiseId) return;
          countById[u.franchiseId] = (countById[u.franchiseId] || 0) + 1;
          const lower = u.franchiseId.toLowerCase();
          countByNameLower[lower] = (countByNameLower[lower] || 0) + 1;
        });

        // Build franchise → capability name lookup from API
        const franchiseCapMap = {};
        const franchiseNameMap = {};
        allFranchises.forEach((f) => {
          franchiseCapMap[f.name?.toLowerCase()]  = resolveCapName(f.capabilityId);
          franchiseNameMap[f.name?.toLowerCase()] = f.name;
        });

        // Build chart data from franchises API, counting actual billable HC
        const built = allFranchises
          .map((f) => ({
            name:  f.name,
            value: countById[f.id] || countByNameLower[f.name?.toLowerCase()] || 0,
            group: resolveCapName(f.capabilityId),
          }))
          .filter((item) => item.value > 0);

        // Sort by capability group so bars of the same BU are adjacent
        built.sort((a, b) => a.group.localeCompare(b.group));

        // Only replace the fallback when we have good coverage across multiple groups.
        // If only one group matched (e.g. D&A+ due to franchiseId text mismatch),
        // keep the full fallback but update the capability group names using the API.
        const coveredGroups = new Set(built.map((b) => b.group)).size;
        if (coveredGroups >= 4) {
          setSbuData(built);
        } else if (allFranchises.length > 0) {
          // Update group names in the fallback from the capabilities API
          setSbuData((prev) =>
            prev.map((item) => ({
              ...item,
              group:
                franchiseCapMap[item.name?.toLowerCase()] ||
                item.group,
              name:
                franchiseNameMap[item.name?.toLowerCase()] ||
                item.name,
            }))
          );
        }
      })
      .catch(() => {}); // silently fall back to hardcoded data
  }, []);

  // ── Derived data ──

  // Unique capability groups in appearance order
  const capabilityGroups = useMemo(
    () => [...new Set(sbuData.map((d) => d.group))],
    [sbuData]
  );

  // Per-bar colors: within each group go light → dark across the palette
  const barColors = useMemo(() => {
    const groupSizes = {};
    sbuData.forEach((item) => {
      groupSizes[item.group] = (groupSizes[item.group] || 0) + 1;
    });

    const posCounters = {};
    const map = {};
    sbuData.forEach((item) => {
      const gIdx    = capabilityGroups.indexOf(item.group);
      const palette = CAPABILITY_PALETTES[gIdx % CAPABILITY_PALETTES.length];
      const pos     = posCounters[item.group] || 0;
      posCounters[item.group] = pos + 1;
      const count   = groupSizes[item.group];

      // Use the middle band of each palette (skip extreme light/dark ends)
      // so all bars in a group look clearly the same colour family.
      const usableStart = 2;
      const usableEnd   = palette.length - 2;
      const range       = usableEnd - usableStart;
      const step        = count > 1 ? range / (count - 1) : 0;
      const colorIdx    = Math.round(usableStart + pos * step);
      map[item.name]    = palette[Math.min(Math.max(colorIdx, usableStart), usableEnd)];
    });
    return map;
  }, [sbuData, capabilityGroups]);

  // Group counts for the proportional label row below the chart
  const groupCounts = useMemo(
    () =>
      Object.entries(
        sbuData.reduce((acc, item) => {
          acc[item.group] = (acc[item.group] || 0) + 1;
          return acc;
        }, {})
      ),
    [sbuData]
  );

  // Legend items for capabilities
  const capabilityLegend = useMemo(
    () =>
      capabilityGroups.map((grp, i) => {
        const palette = CAPABILITY_PALETTES[i % CAPABILITY_PALETTES.length];
        return { name: grp, color: palette[Math.floor(palette.length / 2)] };
      }),
    [capabilityGroups]
  );

  return (
    <>
      <Header />

      <div className="dashboard-header py-4 mb-5">
        <div className="container">
          <h2 className="dashboard-title">Resource Intelligence Dashboard</h2>
          <p className="dashboard-subtitle">
            Workforce Utilization, Allocation, Leakage &amp; Compliance Metrics
          </p>
        </div>
      </div>

      <div className="container">

        {/* Summary Cards */}
        <div className="row mb-4">
          {[
            { value: "142",  label: "Total Resources" },
            { value: "84%",  label: "Billable HC"     },
            { value: "268",  label: "Leakage Hours"   },
            { value: "91%",  label: "Timesheet Compliance" },
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
            <p>
              Dashboard view showing billable headcount distribution, weekly and
              monthly HC trends, current additions, leavers and actual HC summary.
            </p>
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
                    {hcActualData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sub SBU Billable HC chart */}
          <div className="pricing-card sub-sbu-chart-card">
            <h4>Sub SBU wise Billable HC</h4>

            {/* Capability colour legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
              {capabilityLegend.map(({ name, color }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 3, background: color, display: "inline-block" }} />
                  {name}
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={sbuData}
                margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-90}
                  textAnchor="end"
                  height={130}
                  tick={{ fontSize: 11 }}
                />

                <YAxis />

                <Tooltip
                  formatter={(value, name, props) => [value, "Billable HC"]}
                  labelFormatter={(label) => {
                    const item = sbuData.find((d) => d.name === label);
                    return `${label}${item ? ` (${item.group})` : ""}`;
                  }}
                />

                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    fontSize={11}
                    fontWeight="bold"
                    fill="#4A148C"
                  />
                  {sbuData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={barColors[entry.name] || "#9C27B0"}
                    />
                  ))}
                </Bar>

              </BarChart>
            </ResponsiveContainer>

            {/* Proportional group label strip */}
            <div className="sub-sbu-groups">
              {groupCounts.map(([groupName, count], i) => (
                <div
                  key={groupName}
                  className="sbu-group"
                  style={{
                    flex: count,
                    borderTop: `4px solid ${
                      (() => {
                        const p = CAPABILITY_PALETTES[i % CAPABILITY_PALETTES.length];
                        return p[Math.floor(p.length / 2)];
                      })()
                    }`,
                  }}
                >
                  <span>{groupName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4 */}
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
                  <Bar dataKey="allocated" fill="#6A1B9A" name="Allocated" radius={[8,8,0,0]} />
                  <Bar dataKey="actual"    fill="#CE93D8" name="Actual"    radius={[8,8,0,0]} />
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
                    {leakageData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
