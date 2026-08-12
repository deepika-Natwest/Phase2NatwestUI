import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

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


   const COLORS = [
    "#6A1B9A",
    "#8E24AA",
    "#AB47BC",
    "#BA68C8",
    "#CE93D8",
    ];

    const weeklyHCTrend = [
  { week: "April 2026", hc: 557 },
  { week: "April 2026", hc: 558},
  { week: "April 2026", hc: 550 },
  { week: "April 2026", hc: 545 },
  { week: "April 2026", hc: 541 },
  { week: "May 2026", hc: 540},
  { week: "May 2026", hc: 544},
  { week: "May 2026", hc: 547 },
  { week: "May 2026", hc: 550},
  { week: "May 2026", hc: 557},
  { week: "June 2026", hc: 563},
  { week: "June 2026", hc: 560},
  { week: "June 2026", hc: 568},
  { week: "June 2026", hc: 563 },
  { week: "June 2026", hc: 564},
  { week: "July 2026", hc: 543},
 
];

const monthlyHCTrend = [
  { month: "Jan 2024", hc: 557 },
  { month: "Jan 2024", hc: 484},
  { month: "Jan 2024", hc: 515},
  { month: "Jan 2024", hc: 527 },
  { month: "Jan 2024", hc: 556 },
  { month: "Jan 2024", hc: 569},

  { month: "Jul 2024", hc: 580},
  { month: "Jul 2024", hc: 567 },
  { month: "Jul 2024", hc: 509 },

  { month: "Jan 2025", hc: 548 },
  { month: "Jan 2025", hc: 612},
  { month: "Jan 2025", hc: 642 },

  { month: "Jul 2026", hc: 682 },
   { month: "Jul 2026", hc: 659 },
   { month: "Jul 2026", hc: 635 },
 { month: "Jul 2026", hc: 558 },

  { month: "Jan 2026", hc: 553 },
  { month: "Jan 2026", hc: 558 },
 { month: "Jan 2026", hc: 544},
  { month: "Jan 2026", hc: 564 },
 


];

const hcActualData = [
  { name: "A&E+", value: 44},
  { name: "D&A+", value: 112 },
  { name: "Treasury & Markets", value: 140 },
  { name: "FRAL", value: 100 },
  { name: "IRB", value:59  },
  { name: "Infra", value:72  },
  { name: "Murex", value:  16},
];
const currentHC = 543;
const additions = 31;
const leavers = 31;

const projectedHC = currentHC + additions - leavers;


    const SBUwisezbillableHC = [
        
       { name: "A&E", value: 27, group:"A&E+"},
       { name: "Shared Services", value: 6, group:"A&E+" },
       { name: "Bank Of API's", value: 6 , group:"A&E+"},
       { name: "Wealth CRM", value: 5, group:"A&E+"},
  
       { name: "D&A", value: 46, group:"D&A+" },
       { name: "FinCrime", value: 16, group:"D&A+"  },
       { name: "C&I", value: 4 , group:"D&A+" },
       { name: "Wealth Management", value: 7,group:"D&A+"  },
       { name: "REtail Banking", value: 33, group:"D&A+"  },
       { name: "Functions", value: 6, group:"D&A+"  },
 
       { name: "Treasury Solutions-BSM", value: 24, group:"Treasury and Markets"  },
       { name: "Treasury Solutions- Climate", value: 12 , group:"Treasury and Markets"},
       { name: "Treasury Solutions-SFP/others", value: 32, group:"Treasury and Markets" },
       { name: "Natwest Markets", value: 38 , group:"Treasury and Markets"},
       { name: "NWM -RBSI", value: 7 , group:"Treasury and Markets"},
       { name: "Payments", value: 3, group:"Treasury and Markets" },
       { name: "Core Banking", value: 0, group:"Treasury and Markets" },
       { name: "NWM-Ops", value: 4, group:"Treasury and Markets" },
       { name: "Market Risk", value: 20, group:"Treasury and Markets"},

       { name: "FS-FRAL", value: 42, group:"FRAL" },
       { name: "RS-FRAL", value: 40 ,group:"FRAL" },
       { name: "FRAL-Non Consolidated", value: 16,group:"FRAL"  },

       { name: "IRB", value: 59,group:"IRB"  },
       
       { name: "Infra", value: 72, group:"Infra"  },
       
       { name: "Murex", value: 16 , group:"Murex"},

    ];


  const resourceAllocationData = [
    { name: "Java", allocated: 45, actual: 40 },
    { name: "React", allocated: 32, actual: 28 },
    { name: "Testing", allocated: 25, actual: 22 },
    { name: "Data", allocated: 18, actual: 16 },
    { name: "DevOps", allocated: 22, actual: 20 },
  ];

  const utilizationTrendData = [
    { month: "Jan", utilization: 72 },
    { month: "Feb", utilization: 75 },
    { month: "Mar", utilization: 78 },
    { month: "Apr", utilization: 82 },
    { month: "May", utilization: 84 },
    { month: "Jun", utilization: 87 },
  ];

  const leakageData = [
    { name: "Bench", value: 45 },
    { name: "Learning", value: 22 },
    { name: "Admin", value: 15 },
    { name: "Leave", value: 18 },
  ];

  const timesheetData = [
    { name: "Submitted", value: 91 },
    { name: "Pending", value: 6 },
    { name: "Rejected", value: 3 },
  ];

  const projectData = [
    { project: "Digital Banking", hours: 540 },
    { project: "Payments Hub", hours: 480 },
    { project: "Customer Portal", hours: 410 },
    { project: "Reporting Suite", hours: 350 },
    { project: "Data Modernisation", hours: 290 },
  ];

  const locationData = [
    { location: "Gurugram", resources: 55 },
    { location: "Chennai", resources: 35 },
    { location: "Pune", resources: 30 },
    { location: "Bangalore", resources: 22 },
  ];


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
              <h3>142</h3>
              <p>👥 Total Resources</p>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="summary-card">
              <h3>84%</h3>
              <p>⚙️ Billable HC</p>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="summary-card">
              <h3>268</h3>
              <p>⏱ Leakage Hours</p>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="summary-card">
              <h3>91%</h3>
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