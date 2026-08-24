import React, { useState } from "react";
import * as XLSX from "xlsx";
import api from "../../services/api";

// All columns that must be present in the template (in this exact order)
const ALL_HEADERS = [
  "Name",
  "Enterprise ID",
  "Capability",
  "Franchise",
  "Level",
  "Work Location",
  "Project/Program",
  "NWG Line Manager",
  "Resource Type",
  "NatWest DOJ",
  "SOW Start Date",
  "SOW End Date",
  "SOW ID",
];

// Subset that must have non-empty values in every row
const MANDATORY_FIELDS = [
  "Name",
  "Enterprise ID",
  "Capability",
  "Franchise",
  "Level",
  "Work Location",
  "Project/Program",
  "NWG Line Manager",
];

export default function UploadUsersSection() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const validateHeaders = (uploadedHeaders) => {
    const normalizedHeaders = uploadedHeaders.map((header) =>
      String(header || "").trim()
    );

    const missingHeaders = ALL_HEADERS.filter(
      (header) => !normalizedHeaders.includes(header)
    );

    const extraHeaders = normalizedHeaders.filter(
      (header) => !ALL_HEADERS.includes(header)
    );

    const orderMismatch =
      normalizedHeaders.length === ALL_HEADERS.length &&
      normalizedHeaders.some(
        (header, index) => header !== ALL_HEADERS[index]
      );

    const exactLengthMismatch =
      normalizedHeaders.length !== ALL_HEADERS.length;

    return {
      isValid:
        missingHeaders.length === 0 &&
        extraHeaders.length === 0 &&
        !orderMismatch &&
        !exactLengthMismatch,
      missingHeaders,
      extraHeaders,
      orderMismatch,
      exactLengthMismatch,
    };
  };

  const validateRowData = (jsonData) => {
    const rowErrors = [];

    jsonData.forEach((row, index) => {
      const missingFields = MANDATORY_FIELDS.filter((header) => {
        const value = row[header];
        return value === undefined || value === null || String(value).trim() === "";
      });

      if (missingFields.length > 0) {
        rowErrors.push({
          rowNumber: index + 2,
          missingFields,
        });
      }
    });

    return rowErrors;
  };

  const handleUpload = async () => {
    setError("");
    setSuccess("");

    if (!file) {
      setError("Please select an Excel file first.");
      return;
    }

    const fileName = file.name.toLowerCase();
    const isExcelFile = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (!isExcelFile) {
      setError("Please upload a valid Excel file (.xlsx or .xls).");
      return;
    }

    try {
      setLoading(true);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setError("The uploaded Excel file does not contain any sheet.");
        setLoading(false);
        return;
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: false,
      });

      if (!rows || rows.length === 0) {
        setError("The uploaded Excel file is empty.");
        setLoading(false);
        return;
      }

      const uploadedHeaders = rows[0];
      const headerValidation = validateHeaders(uploadedHeaders);

      if (!headerValidation.isValid) {
        let message = "Invalid Excel format.\n\n";

        if (headerValidation.missingHeaders.length > 0) {
          message += `Missing columns: ${headerValidation.missingHeaders.join(", ")}\n`;
        }

        if (headerValidation.extraHeaders.length > 0) {
          message += `Unexpected columns: ${headerValidation.extraHeaders.join(", ")}\n`;
        }

        if (headerValidation.orderMismatch) {
          message += "Column order has been changed.\n";
        }

        if (headerValidation.exactLengthMismatch) {
          message += "Number of columns does not match the template.\n";
        }

        message += "\nPlease download and use the correct template.";
        setError(message);
        setLoading(false);
        return;
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        blankrows: false,
      });

      if (jsonData.length === 0) {
        setError("The file contains headers but no user data.");
        setLoading(false);
        return;
      }

      const rowValidationErrors = validateRowData(jsonData);

      if (rowValidationErrors.length > 0) {
        const formattedErrors = rowValidationErrors
          .map(
            (item) =>
              `Row ${item.rowNumber}: Missing fields - ${item.missingFields.join(", ")}`
          )
          .join("\n");

        setError(`Some rows have missing required fields:\n\n${formattedErrors}`);
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/users/upload", formData);

      setSuccess(
        `${res.data.message} (Created: ${res.data.createdCount || 0}, Updated: ${res.data.updatedCount || 0}, Total: ${res.data.count || 0})`
      );
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please make sure you are using the correct Excel template.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-3">
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => {
          setFile(e.target.files[0]);
          setError("");
          setSuccess("");
        }}
        className="form-control mb-2"
      />

      <button
        className="btn btn-primary"
        onClick={handleUpload}
        disabled={loading}
      >
        {loading ? "Validating & Uploading..." : "Upload Users"}
      </button>

      {error && (
        <div
          className="alert alert-danger mt-3 mb-0"
          style={{ whiteSpace: "pre-line" }}
        >
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success mt-3 mb-0">
          {success}
        </div>
      )}
    </div>
  );
}