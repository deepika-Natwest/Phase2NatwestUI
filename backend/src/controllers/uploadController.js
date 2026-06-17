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

    // Load existing users
    const existingUsers = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath, "utf8"))
      : [];

    // Map uploaded users
    // This is the important fix:
    // uploaded file column names are matched with backend/master keys
    const processedUsers = await Promise.all(
      usersFromFile.map(async (user) => {
        const id = user.id || user.Id || uuidv4();

        let password = user.password || user.Password || "";
        password = String(password || "").trim();

        if (password && !password.startsWith("$2b$")) {
          password = await bcrypt.hash(password, 10);
        }

        return {
          id,

          // Match uploaded file headers with backend keys
          name: user.name || user.Name || "",
          enterpriseId: user.enterpriseId || user["Enterprise ID"] || "",
          password: password || "",
          gender: user.gender || user.Gender || "",
          location: user.location || user["Work Location"] || "",
          careerLevel: user.careerLevel || user.Level || "",
          lineManager: user.lineManager || user["NWG Line Manager"] || "",
          projectName: user.projectName || user["Project/Program"] || "",
          role: user.role || user.Role || "user",
          status: user.status || user.Status || "Active",
          capabilityId: user.capabilityId || user.Capability || "",
          franchiseId: user.franchiseId || user.Franchise || "",
          profilePic: user.profilePic || user["Profile Pic"] || "",
          shortDescription: user.shortDescription || user["Short Description"] || "",
          createdAt: user.createdAt || user["Created At"] || new Date().toISOString(),
        };
      })
    );

    // Merge uploaded users with existing users
    // Better to merge by enterpriseId instead of id,
    // because uploaded files usually won't contain your internal UUIDs
    const mergedUsers = [
      ...existingUsers.filter(
        (u) =>
          !processedUsers.some(
            (nu) =>
              String(nu.enterpriseId || "").trim().toLowerCase() ===
              String(u.enterpriseId || "").trim().toLowerCase()
          )
      ),
      ...processedUsers,
    ];

    // Save back to JSON
    fs.writeFileSync(dataPath, JSON.stringify(mergedUsers, null, 2));

    // Delete temp file
    fs.unlinkSync(filePath);

    res.json({
      message: "Users uploaded successfully",
      count: processedUsers.length,
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