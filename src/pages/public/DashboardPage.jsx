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
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  LabelList,

} from "recharts";

import "../../assets/styles/dashboard.css";

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/data")
      .then((res) => {
        setDashboardData(res.data);
      })
      .catch((err) => {
        console.error("Failed to load dashboard data", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

   const COLORS = [
    "#6A1B9A",
    "#8E24AA",
    "#AB47BC",
    "#BA68C8",
    "#CE93D8",
    ];

  if (loading) {
    return (
      <>
        <Header />
        <div className="container py-5 text-center">
          <p>Loading dashboard data...</p>
        </div>
        <Footer />
      </>
    );
  }

  const weeklyHCTrend = dashboardData?.weeklyHCTrend || [];
  const monthlyHCTrend = dashboardData?.monthlyHCTrend || [];
  const hcActualData = dashboardData?.hcActualData || [];
  const currentHC = dashboardData?.currentHC ?? 0;
  const additions = dashboardData?.additions ?? 0;
  const leavers = dashboardData?.leavers ?? 0;
  const projectedHC = currentHC + additions - leavers;
  const SBUwisezbillableHC = dashboardData?.SBUwisezbillableHC || [];
  const resourceAllocationData = dashboardData?.resourceAllocationData || [];
  const leakageData = dashboardData?.leakageData || [];
  const summaryCards = dashboardData?.summaryCards || {};

const groupCounts = Object.entries(
  SBUwisezbillableHC.reduce((acc, item) => {
    acc[item.group] = (acc[item.group] || 0) + 1;
    return acc;
  }, {})
);

const dividerNames = [];
let previousGroup = SBUwisezbillableHC[0]?.group;

for (let i = 1; i < SBUwisezbillableHC.length; i++) {
  if (SBUwisezbillableHC[i].group !== previousGroup) {
    dividerNames.push(SBUwisezbillableHC[i - 1].name);
    previousGroup = SBUwisezbillableHC[i].group;
  }
}


  return (
    <>
      <Header />

      {/* Header */}
      <div className="dashboard-header py-4 mb-5">
        <div className="container">
          <h2 className="dashboard-title">
            📊 Resource Intelligence Dashboard
          </h2>
          <p className="dashboard-subtitle">
            Workforce Utilization, Allocation, Leakage & Compliance Metrics
          </p>
        </div>
      </div>

      <div className="container">

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="summary-card">
              <h3>{summaryCards.totalResources ?? 142}</h3>
              <p>👥 Total Resources</p>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="summary-card">
              <h3>{summaryCards.billableHCPct ?? 84}%</h3>
              <p>⚙️ Billable HC</p>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="summary-card">
              <h3>{summaryCards.leakageHours ?? 268}</h3>
              <p>⏱ Leakage Hours</p>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="summary-card">
              <h3>{summaryCards.timesheetCompliance ?? 91}%</h3>
              <p>📝 Timesheet Compliance</p>
            </div>
          </div>
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

            <div className="summary-row">
              <span>Current HC</span>
              <strong>{currentHC}</strong>
            </div>

            <div className="summary-row">
              <span>Additions</span>
              <strong className="positive-value">
                +{additions}
              </strong>
            </div>

            <div className="summary-row">
              <span>Leavers</span>
              <strong className="negative-value">
                -{leavers}
              </strong>
            </div>

            <div className="summary-total">
              <span>Projected HC Month-end</span>
              <strong>{projectedHC}</strong>
            </div>
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
  <LabelList
    dataKey="value"
    position="top"
    fill="#4A148C"
    fontSize={12}
    fontWeight="bold"
  />

  {hcActualData.map((entry, index) => (
    <Cell
      key={`actual-${index}`}
      fill={COLORS[index % COLORS.length]}
    />
  ))}
</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
              {/* Row 2 */}
              <div className="middle-row">
                <div className="pricing-card">
                  <h4>HC Weekly Trend</h4>

                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={weeklyHCTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                     <XAxis
                       dataKey="week"
                       interval={0}
                       tickFormatter={(value, index) => {
                       const prevWeek = weeklyHCTrend[index - 1]?.week;
                       return prevWeek === value ? "" : value;
                       }}
                      />
                      <YAxis
          domain={[540, 570]}
          ticks={[540,545, 550,555, 560,565, 570]}
        />
                      <Tooltip />
                      <Legend />

<Line
  type="monotone"
  dataKey="hc"
  stroke={COLORS[2]}
  strokeWidth={3}
  dot={{
    fill: COLORS[2],
    stroke: COLORS[2],
    r: 5,
  }}
>
  <LabelList
    dataKey="hc"
    position="top"
    fill="#4A148C"
    fontSize={11}
    fontWeight="bold"
  />
</Line>

                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="pricing-card">
                  <h4>HC Monthly Trend</h4>

                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={monthlyHCTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
          dataKey="month"
          interval={0}
          tickFormatter={(value, index) => {
            const prevMonth = monthlyHCTrend[index - 1]?.month;
            return prevMonth === value ? "" : value;
          }}
        />
                      <YAxis
          domain={[500, 600]}
          ticks={[500, 520, 540, 560, 580, 600, 700]}
        />
                      <Tooltip />
                      <Legend />

                     <Line
  type="monotone"
  dataKey="hc"
  stroke={COLORS[2]}
  strokeWidth={3}
  dot={{
    fill: COLORS[2],
    stroke: COLORS[2],
    r: 5,
  }}
>
  <LabelList
    dataKey="hc"
    position="top"
    fill="#4A148C"
    fontSize={11}
    fontWeight="bold"
  />
</Line>

                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 3 */}
              <div className="pricing-card sub-sbu-chart-card">
                <h4>Sub SBU wise Billable HC</h4>

                <ResponsiveContainer width="100%" height={500}>
                  <BarChart
                    data={SBUwisezbillableHC}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 20,
                      bottom: 40,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-90}
                      textAnchor="end"
                      height={130}
                    />

                    <YAxis />
                    <Tooltip />

                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
  <LabelList
    dataKey="value"
    position="top"
    fill="#4A148C"
    fontSize={11}
    fontWeight="bold"
  />

  {SBUwisezbillableHC.map((entry, index) => (
    <Cell
      key={`subsbu-${index}`}
      fill={COLORS[index % COLORS.length]}
    />
  ))}
</Bar>

                    {dividerNames.map((index) => (
                      <ReferenceLine
                        key={index}
                        x={index,0.5}
                        stroke="#6A1B9A"
                        strokeWidth={1}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>

                <div className="sub-sbu-groups">
                  {groupCounts.map(([groupName, count]) => (
                    <div
                      key={groupName}
                      className="sbu-group"
                      style={{ flex: count }}
                    >
                      <span>{groupName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SBU Heat-map Table */}
              <div className="pricing-card mt-4">
                <h4>Sub SBU wise Billable HC — Summary Table</h4>
                <div style={{ overflowX: "auto" }}>
                  <table className="table table-bordered table-sm mb-0" style={{ fontSize: "13px" }}>
                    <thead style={{ backgroundColor: "#4A148C", color: "#fff" }}>
                      <tr>
                        <th>#</th>
                        <th>BU / Group</th>
                        <th>Sub SBU</th>
                        <th style={{ textAlign: "right" }}>Billable HC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SBUwisezbillableHC.map((entry, idx) => {
                        const allValues = SBUwisezbillableHC.map(e => e.value);
                        const min = Math.min(...allValues);
                        const max = Math.max(...allValues);
                        const ratio = max === min ? 1 : (entry.value - min) / (max - min);
                        // Interpolate green (high) → yellow (mid) → red (low)
                        const r = Math.round(ratio < 0.5 ? 255 : 255 * (1 - (ratio - 0.5) * 2));
                        const g = Math.round(ratio < 0.5 ? 255 * ratio * 2 : 255);
                        const bgColor = `rgba(${r}, ${g}, 80, 0.25)`;
                        return (
                          <tr key={idx} style={{ backgroundColor: bgColor }}>
                            <td>{idx + 1}</td>
                            <td>{entry.group || "—"}</td>
                            <td><strong>{entry.name}</strong></td>
                            <td style={{ textAlign: "right", fontWeight: "bold" }}>{entry.value}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="d-flex gap-3 mt-2 align-items-center" style={{ fontSize: "12px" }}>
                <span>Color scale:</span>
                <span style={{ background: "rgba(255,80,80,0.35)", padding: "2px 10px", borderRadius: "4px" }}>Low</span>
                <span style={{ background: "rgba(255,255,80,0.35)", padding: "2px 10px", borderRadius: "4px" }}>Medium</span>
                <span style={{ background: "rgba(80,255,80,0.35)", padding: "2px 10px", borderRadius: "4px" }}>High</span>
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

                  <Bar
                    dataKey="allocated"
                    fill="#6A1B9A"
                    name="Allocated"
                    radius={[8, 8, 0, 0]}
                  />

                  <Bar
                    dataKey="actual"
                    fill="#CE93D8"
                    name="Actual"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-lg-4 mb-4">
            <div className="graph-card">
              <h5>Prof </h5>

              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={leakageData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >
                    {leakageData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
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
