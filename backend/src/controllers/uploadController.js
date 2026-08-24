const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

// Path to your JSON
const dataPath = path.join(__dirname, "../../data/users.json");

const uploadUsers = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = path.join(__dirname, "../../", req.file.path);
  const ext = path.extname(req.file.originalname).toLowerCase();

  let usersFromFile = [];

  try {
    // Parse Excel
    if (ext === ".xlsx" || ext === ".xls") {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      usersFromFile = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        defval: "",
      });
    } else {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    if (!usersFromFile.length) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Uploaded file is empty" });
    }

    // Strict header validation
    const expectedHeaders = [
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

    const uploadedHeaders = Object.keys(usersFromFile[0]).map((h) => h.trim());

    const headersMatch =
      expectedHeaders.length === uploadedHeaders.length &&
      expectedHeaders.every((header, index) => header === uploadedHeaders[index]);

    if (!headersMatch) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        message:
          "Invalid template. Please use the downloaded template only. Do not rename, delete, reorder, or add columns.",
      });
    }

    // Load existing users
    const existingUsers = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath, "utf8"))
      : [];

    const rowErrors = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < usersFromFile.length; i++) {
      const user = usersFromFile[i];

      const name = String(user.Name || "").trim();
      const enterpriseId = String(user["Enterprise ID"] || "").trim();
      const capability = String(user.Capability || "").trim();
      const franchise = String(user.Franchise || "").trim();
      const level = String(user.Level || "").trim();
      const workLocation = String(user["Work Location"] || "").trim();
      const projectName = String(user["Project/Program"] || "").trim();
      const lineManager = String(user["NWG Line Manager"] || "").trim();
      const resourceType = String(user["Resource Type"] || "").trim();
      const natwestDoj = String(user["NatWest DOJ"] || "").trim();
      const sowStartDate = String(user["SOW Start Date"] || "").trim();
      const sowEndDate = String(user["SOW End Date"] || "").trim();
      const sowId = String(user["SOW ID"] || "").trim();

      if (
        !name ||
        !enterpriseId ||
        !capability ||
        !franchise ||
        !level ||
        !workLocation ||
        !projectName ||
        !lineManager
      ) {
        rowErrors.push(`Row ${i + 2}: All fields are mandatory.`);
        continue;
      }

      const existingIndex = existingUsers.findIndex(
        (u) =>
          String(u.enterpriseId || "").trim().toLowerCase() ===
          enterpriseId.toLowerCase()
      );

      if (existingIndex !== -1) {
        // Update only template fields, keep all other existing fields unchanged
        existingUsers[existingIndex] = {
          ...existingUsers[existingIndex],
          name,
          enterpriseId,
          capabilityId: capability,
          franchiseId: franchise,
          careerLevel: level,
          location: workLocation,
          projectName,
          lineManager,
          resourceType,
          natwestDoj,
          sowStartDate,
          sowEndDate,
          sowId,
        };

        updatedCount++;
      } else {
        // Create new user with defaults
        let password = "";
        if (password && !password.startsWith("$2b$")) {
          password = await bcrypt.hash(password, 10);
        }

        existingUsers.push({
          id: uuidv4(),
          name,
          enterpriseId,
          password,
          gender: "",
          location: workLocation,
          careerLevel: level,
          lineManager,
          projectName,
          role: "user",
          status: "Active",
          capabilityId: capability,
          franchiseId: franchise,
          profilePic: "",
          shortDescription: "",
          resourceType,
          natwestDoj,
          sowStartDate,
          sowEndDate,
          sowId,
          createdAt: new Date().toISOString(),
        });

        createdCount++;
      }
    }

    // Save back to JSON
    fs.writeFileSync(dataPath, JSON.stringify(existingUsers, null, 2));

    // Delete temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (rowErrors.length > 0) {
      return res.status(400).json({
        message: "Some rows failed validation",
        errors: rowErrors,
        createdCount,
        updatedCount,
      });
    }

    res.json({
      message: "Users uploaded successfully",
      createdCount,
      updatedCount,
      count: createdCount + updatedCount,
    });
  } catch (err) {
    console.error(err);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(500).json({
      message: "Error processing file",
      error: err.message,
    });
  }
};

module.exports = { uploadUsers };