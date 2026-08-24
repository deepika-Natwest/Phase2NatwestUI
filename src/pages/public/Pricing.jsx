import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../services/api";

// SOW Public Page

function Pricing() {
  const allColumns = [
    { key: "category", label: "SBU / Row Label", className: "header-blue" },
    { key: "futureEnding", label: "Future Ending", className: "header-green" },
    { key: "expiring1130", label: "Expiring 11-30 Days", className: "header-orange" },
    { key: "expiring3160", label: "Expiring 31-60 Days", className: "header-yellow" },
    { key: "nba", label: "NBA", className: "header-red" },
    { key: "plannedRelease", label: "Planned Release", className: "header-grey" },
    { key: "attrition", label: "Attrition", className: "header-blue" },
    { key: "rollOff", label: "Roll off from current role", className: "header-blue" },
    {
      key: "fgAvailable",
      label: "Extension/SOW Issued - FG ID available",
      className: "header-green",
    },
    {
      key: "fgNotAvailable",
      label: "Extension/SOW Issued - FG ID not available",
      className: "header-orange",
    },
    {
      key: "toBeIssued",
      label: "Extension/SOW to be Issued",
      className: "header-red",
    },
    {
      key: "clientConfirmationAwaited",
      label: "Client Confirmation Awaited",
      className: "header-dark-red",
    },
    { key: "grandTotal", label: "Grand Total", className: "header-cyan" },
  ];

  const expiryColumns = [
    { key: "category", label: "SBU / Row Label", className: "header-blue" },
    { key: "futureEnding", label: "Future Ending", className: "header-green" },
    { key: "expiring1130", label: "Expiring 11-30 Days", className: "header-orange" },
    { key: "expiring3160", label: "Expiring 31-60 Days", className: "header-yellow" },
    { key: "nba", label: "NBA", className: "header-red" },
    { key: "plannedRelease", label: "Planned Release", className: "header-grey" },
    { key: "grandTotal", label: "Grand Total", className: "header-cyan" },
  ];

  const attritionColumns = [
    { key: "category", label: "SBU / Row Label", className: "header-blue" },
    { key: "attrition", label: "Attrition", className: "header-blue" },
    { key: "rollOff", label: "Roll off from current role", className: "header-blue" },
    { key: "grandTotal", label: "Grand Total", className: "header-cyan" },
  ];

  const extensionColumns = [
    { key: "category", label: "SBU / Row Label", className: "header-blue" },
    {
      key: "fgAvailable",
      label: "Extension/SOW Issued - FG ID available",
      className: "header-green",
    },
    {
      key: "fgNotAvailable",
      label: "Extension/SOW Issued - FG ID not available",
      className: "header-orange",
    },
    {
      key: "toBeIssued",
      label: "Extension/SOW to be Issued",
      className: "header-red",
    },
    {
      key: "clientConfirmationAwaited",
      label: "Client Confirmation Awaited",
      className: "header-dark-red",
    },
    { key: "grandTotal", label: "Grand Total", className: "header-cyan" },
  ];

  const expiryData = [
    {
      id: 1,
      category: "A&E+",
      futureEnding: 15,
      expiring1130: 5,
      expiring3160: 7,
      nba: 1,
      plannedRelease: 2,
      grandTotal: 30,
    },
    {
      id: 2,
      category: "D&A+",
      futureEnding: 12,
      expiring1130: 3,
      expiring3160: 6,
      nba: 2,
      plannedRelease: 1,
      grandTotal: 24,
    },
    {
      id: 3,
      category: "FRAL",
      futureEnding: 8,
      expiring1130: 2,
      expiring3160: 4,
      nba: 1,
      plannedRelease: 0,
      grandTotal: 15,
    },
    {
      id: 4,
      category: "Infra",
      futureEnding: 14,
      expiring1130: 6,
      expiring3160: 5,
      nba: 2,
      plannedRelease: 3,
      grandTotal: 30,
    },
    {
      id: 5,
      category: "IRB",
      futureEnding: 7,
      expiring1130: 3,
      expiring3160: 2,
      nba: 1,
      plannedRelease: 1,
      grandTotal: 14,
    },
    {
      id: 6,
      category: "Murex",
      futureEnding: 10,
      expiring1130: 4,
      expiring3160: 3,
      nba: 1,
      plannedRelease: 2,
      grandTotal: 20,
    },
    {
      id: 7,
      category: "Treasury & Markets",
      futureEnding: 18,
      expiring1130: 7,
      expiring3160: 8,
      nba: 3,
      plannedRelease: 4,
      grandTotal: 40,
    },
    {
      id: 8,
      category: "Retail Banking",
      futureEnding: 11,
      expiring1130: 4,
      expiring3160: 5,
      nba: 2,
      plannedRelease: 1,
      grandTotal: 23,
    },
    {
      id: 9,
      category: "Cards",
      futureEnding: 9,
      expiring1130: 3,
      expiring3160: 2,
      nba: 1,
      plannedRelease: 1,
      grandTotal: 16,
    },
    {
      id: 10,
      category: "Shared Services",
      futureEnding: 13,
      expiring1130: 5,
      expiring3160: 4,
      nba: 1,
      plannedRelease: 2,
      grandTotal: 25,
    },
  ];

  const attritionData = [
    {
      id: 1,
      category: "A&E+",
      attrition: 2,
      rollOff: 3,
      grandTotal: 5,
    },
    {
      id: 2,
      category: "D&A+",
      attrition: 1,
      rollOff: 4,
      grandTotal: 5,
    },
    {
      id: 3,
      category: "FRAL",
      attrition: 0,
      rollOff: 2,
      grandTotal: 2,
    },
    {
      id: 4,
      category: "Infra",
      attrition: 3,
      rollOff: 5,
      grandTotal: 8,
    },
    {
      id: 5,
      category: "Treasury & Markets",
      attrition: 2,
      rollOff: 6,
      grandTotal: 8,
    },
  ];

  const extensionData = [
    {
      id: 1,
      category: "A&E+",
      fgAvailable: 12,
      fgNotAvailable: 4,
      toBeIssued: 3,
      clientConfirmationAwaited: 2,
      grandTotal: 21,
    },
    {
      id: 2,
      category: "D&A+",
      fgAvailable: 10,
      fgNotAvailable: 3,
      toBeIssued: 4,
      clientConfirmationAwaited: 1,
      grandTotal: 18,
    },
    {
      id: 3,
      category: "FRAL",
      fgAvailable: 7,
      fgNotAvailable: 2,
      toBeIssued: 2,
      clientConfirmationAwaited: 1,
      grandTotal: 12,
    },
    {
      id: 4,
      category: "Infra",
      fgAvailable: 13,
      fgNotAvailable: 5,
      toBeIssued: 6,
      clientConfirmationAwaited: 3,
      grandTotal: 27,
    },
    {
      id: 5,
      category: "Treasury & Markets",
      fgAvailable: 15,
      fgNotAvailable: 6,
      toBeIssued: 5,
      clientConfirmationAwaited: 4,
      grandTotal: 30,
    },
  ];

  const [backendPricing, setBackendPricing] = useState(null);

  useEffect(() => {
    api.get("/pricing")
      .then((response) => setBackendPricing(response.data))
      .catch((error) => console.error("Failed to load pricing data:", error));
  }, []);

  const expiryRows = backendPricing?.expiry || [];
  const attritionRows = backendPricing?.attrition || [];
  const extensionRows = backendPricing?.extension || [];

  const [selectedView, setSelectedView] = useState("all");

  const addGrandTotalRow = (rows, columns) => {
    const rowsWithoutGrandTotal = rows.filter(
      (row) => String(row.category || "").toLowerCase().trim() !== "grand total"
    );

    const grandTotalRow = {
      id: "grand-total",
      category: "Grand Total",
    };

    columns.forEach((column) => {
      if (column.key === "category") return;

      grandTotalRow[column.key] = rowsWithoutGrandTotal.reduce((total, row) => {
        const value = row[column.key];

        if (value === "" || value === null || value === undefined) {
          return total;
        }

        const numericValue = Number(value);

        return Number.isNaN(numericValue) ? total : total + numericValue;
      }, 0);
    });

    return [...rowsWithoutGrandTotal, grandTotalRow];
  };

  const mergedAllData = useMemo(() => {
    const mergedMap = {};

    const createEmptyRow = (category) => ({
      id: category.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      category,
      futureEnding: "",
      expiring1130: "",
      expiring3160: "",
      nba: "",
      plannedRelease: "",
      attrition: "",
      rollOff: "",
      fgAvailable: "",
      fgNotAvailable: "",
      toBeIssued: "",
      clientConfirmationAwaited: "",
      grandTotal: 0,
    });

    expiryRows.forEach((row) => {
      if (!mergedMap[row.category]) {
        mergedMap[row.category] = createEmptyRow(row.category);
      }

      mergedMap[row.category].futureEnding = row.futureEnding;
      mergedMap[row.category].expiring1130 = row.expiring1130;
      mergedMap[row.category].expiring3160 = row.expiring3160;
      mergedMap[row.category].nba = row.nba;
      mergedMap[row.category].plannedRelease = row.plannedRelease;
    });

    attritionRows.forEach((row) => {
      if (!mergedMap[row.category]) {
        mergedMap[row.category] = createEmptyRow(row.category);
      }

      mergedMap[row.category].attrition = row.attrition;
      mergedMap[row.category].rollOff = row.rollOff;
    });

    extensionRows.forEach((row) => {
      if (!mergedMap[row.category]) {
        mergedMap[row.category] = createEmptyRow(row.category);
      }

      mergedMap[row.category].fgAvailable = row.fgAvailable;
      mergedMap[row.category].fgNotAvailable = row.fgNotAvailable;
      mergedMap[row.category].toBeIssued = row.toBeIssued;
      mergedMap[row.category].clientConfirmationAwaited =
        row.clientConfirmationAwaited;
    });

    const mergedRows = Object.values(mergedMap).map((row) => {
      const grandTotal =
        Number(row.futureEnding || 0) +
        Number(row.expiring1130 || 0) +
        Number(row.expiring3160 || 0) +
        Number(row.nba || 0) +
        Number(row.plannedRelease || 0) +
        Number(row.attrition || 0) +
        Number(row.rollOff || 0) +
        Number(row.fgAvailable || 0) +
        Number(row.fgNotAvailable || 0) +
        Number(row.toBeIssued || 0) +
        Number(row.clientConfirmationAwaited || 0);

      return {
        ...row,
        grandTotal,
      };
    });

    return addGrandTotalRow(mergedRows, allColumns);
  }, [expiryRows, attritionRows, extensionRows]);

  const expiryDataWithGrandTotal = useMemo(() => {
    return addGrandTotalRow(expiryRows, expiryColumns);
  }, [expiryRows]);

  const attritionDataWithGrandTotal = useMemo(() => {
    return addGrandTotalRow(attritionRows, attritionColumns);
  }, [attritionRows]);

  const extensionDataWithGrandTotal = useMemo(() => {
    return addGrandTotalRow(extensionRows, extensionColumns);
  }, [extensionRows]);

  const currentTableConfig = useMemo(() => {
    if (selectedView === "expiry") {
      return {
        title: "SOW Expiry Summary",
        subtitle: "SBU-wise expiry ageing summary",
        columns: expiryColumns,
        data: expiryDataWithGrandTotal,
        fileName: "SOW_Expiry_Summary",
      };
    }

    if (selectedView === "attrition") {
      return {
        title: "Attrition Summary",
        subtitle: "Attrition and roll-off summary",
        columns: attritionColumns,
        data: attritionDataWithGrandTotal,
        fileName: "Attrition_Summary",
      };
    }

    if (selectedView === "extension") {
      return {
        title: "Extension Status Summary",
        subtitle: "SOW extension issuance and confirmation status",
        columns: extensionColumns,
        data: extensionDataWithGrandTotal,
        fileName: "Extension_Status_Summary",
      };
    }

    return {
      title: "All SOW Dashboard Data",
      subtitle: "Merged SBU-wise view of expiry, attrition and extension tracking",
      columns: allColumns,
      data: mergedAllData,
      fileName: "All_SOW_Dashboard_Data",
    };
  }, [
    selectedView,
    mergedAllData,
    expiryDataWithGrandTotal,
    attritionDataWithGrandTotal,
    extensionDataWithGrandTotal,
  ]);

  return (
    <>
      <Header />

      <div className="pricing-dashboard">
        <style>{dashboardStyles}</style>

        <div className="pricing-dashboard-header">
          <div>
            <h1>SOW Expiring Dashboard</h1>
            <p>Enterprise report view for SOW expiry, attrition and extension tracking</p>
          </div>

          <div className="pricing-header-actions">
            <select
              className="table-view-dropdown"
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
            >
              <option value="all">All Data</option>
              <option value="expiry">SOW Expiry Summary</option>
              <option value="attrition">Attrition Summary</option>
              <option value="extension">Extension Status Summary</option>
            </select>


          </div>
        </div>

        <div className="pricing-single-table-card">
          <ReportTable
            title={currentTableConfig.title}
            subtitle={currentTableConfig.subtitle}
            columns={currentTableConfig.columns}
            data={currentTableConfig.data}
            fileName={currentTableConfig.fileName}
          />
        </div>
      </div>

      <Footer />
    </>
  );
}

function ReportTable({ title, subtitle, columns, data, fileName }) {
  const [sortConfig, setSortConfig] = useState({
    key: columns[0]?.key || "",
    direction: "asc",
  });

  useEffect(() => {
    setSortConfig({
      key: columns[0]?.key || "",
      direction: "asc",
    });
  }, [columns]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  };

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aTotal =
        String(a.category || "").toLowerCase().trim() === "grand total";
      const bTotal =
        String(b.category || "").toLowerCase().trim() === "grand total";

      if (aTotal) return 1;
      if (bTotal) return -1;

      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];

      const isNumberA = valueA !== "" && !isNaN(Number(valueA));
      const isNumberB = valueB !== "" && !isNaN(Number(valueB));

      if (isNumberA && isNumberB) {
        return sortConfig.direction === "asc"
          ? Number(valueA) - Number(valueB)
          : Number(valueB) - Number(valueA);
      }

      return sortConfig.direction === "asc"
        ? String(valueA || "").localeCompare(String(valueB || ""))
        : String(valueB || "").localeCompare(String(valueA || ""));
    });

    return sorted;
  }, [data, sortConfig]);

  const exportToCSV = () => {
    const headers = columns.map((col) => col.label);

    const rows = sortedData.map((row) =>
      columns.map((col) => {
        const cellValue = row[col.key] ?? "";
        return `"${String(cellValue).replace(/"/g, '""')}"`;
      })
    );

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="report-table-wrapper">
      <div className="report-table-top">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="report-table-actions">
          <button type="button" className="export-button" onClick={exportToCSV}>
            Export Excel
          </button>
        </div>
      </div>

      <div className="table-scroll-wrapper">
        <table className="pricing-report-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.className}
                  onClick={() => handleSort(column.key)}
                >
                  <span className="sortable-header">
                    {column.label}
                    <span className="sort-icon">
                      {sortConfig.key === column.key
                        ? sortConfig.direction === "asc"
                          ? " ▲"
                          : " ▼"
                        : " ↕"}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="no-data-cell">
                  No records found
                </td>
              </tr>
            ) : (
              sortedData.map((row) => {
                const isGrandTotal =
                  String(row.category || "").toLowerCase().trim() === "grand total";

                return (
                  <tr key={row.id} className={isGrandTotal ? "grand-total-row" : ""}>
                    {columns.map((column) => (
                      <td key={column.key}>{row[column.key]}</td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const dashboardStyles = `
  * {
    box-sizing: border-box;
  }

  .pricing-dashboard {
    min-height: calc(100vh - 120px);
    padding: 0 0 24px;
    background: #f5f7fb;
    font-family: "Roboto", Arial, sans-serif;
    color: #1f2937;
  }

  .pricing-dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    gap: 16px;
    background: linear-gradient(135deg, #4a148c, #6a1b9a, #8e24aa);
    padding: 24px 32px;
    border-radius: 0;
  }

  .pricing-dashboard-header h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: #ffffff;
  }

  .pricing-dashboard-header p {
    margin: 6px 0 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
  }

  .pricing-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .table-view-dropdown {
    height: 36px;
    min-width: 230px;
    padding: 6px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 999px;
    background: #ffffff;
    color: #1f2937;
    font-size: 13px;
    font-weight: 600;
    outline: none;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .table-view-dropdown:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
  }

  .pricing-report-badge {
    background: #ffffff;
    color: #2563eb;
    border: 1px solid #d9d9d9;
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .pricing-single-table-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    min-width: 0;
    margin: 24px;
  }

  .report-table-wrapper {
    padding: 18px;
  }

  .report-table-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 14px;
  }

  .report-table-top h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }

  .report-table-top p {
    margin: 4px 0 0;
    font-size: 13px;
    color: #6b7280;
  }

  .report-table-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .export-button {
    height: 34px;
    padding: 0 14px;
    border: none;
    border-radius: 6px;
    background: #2563eb;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .export-button:hover {
    background: #1d4ed8;
  }

  .table-scroll-wrapper {
    width: 100%;
    max-height: 620px;
    overflow: auto;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
  }

  .pricing-report-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .pricing-report-table th,
  .pricing-report-table td {
    border: 1px solid #d9d9d9;
    padding: 8px 12px;
    height: 40px;
    white-space: nowrap;
    text-align: left;
  }

  .pricing-report-table th {
    position: sticky;
    top: 0;
    z-index: 5;
    font-weight: 600;
    cursor: pointer;
    color: #111827;
  }

  .pricing-report-table tbody tr:nth-child(even) {
    background: #fafafa;
  }

  .pricing-report-table tbody tr:hover {
    background: #eef6ff;
  }

  .sortable-header {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .sort-icon {
    font-size: 11px;
    opacity: 0.75;
  }

  .grand-total-row {
    background: #d9ead3 !important;
    font-weight: 700;
  }

  .grand-total-row td {
    border-top: 2px solid #9ca3af;
  }

  .pricing-report-table td:last-child {
    font-weight: 700;
    background: #eef9fc;
  }

  .grand-total-row td:last-child {
    background: #c6e0b4;
  }

  .no-data-cell {
    text-align: center !important;
    color: #6b7280;
    font-weight: 500;
  }

  .header-blue {
    background: #9dc3e6;
  }

  .header-grey {
    background: #d9e1f2;
  }

  .header-green {
    background: #c6e0b4;
  }

  .header-orange {
    background: #f4b183;
  }

  .header-yellow {
    background: #ffd966;
  }

  .header-red {
    background: #f4cccc;
  }

  .header-dark-red {
    background: #c00000;
    color: #ffffff !important;
  }

  .header-cyan {
    background: #9ed7e8;
    font-weight: 700;
  }

  @media (max-width: 768px) {
    .pricing-dashboard {
      padding: 0 0 16px;
    }

    .pricing-dashboard-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .pricing-header-actions {
      width: 100%;
      flex-direction: column;
      align-items: stretch;
    }

    .table-view-dropdown,
    .pricing-report-badge {
      width: 100%;
    }

    .report-table-top {
      flex-direction: column;
      align-items: stretch;
    }

    .report-table-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .export-button {
      width: 100%;
    }
  }
`;

export default Pricing;