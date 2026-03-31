const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const bcrypt = require("bcrypt");

// Path to your JSON
const dataPath = path.join(__dirname, "../../data/users.json");

const uploadUsers = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = path.join(__dirname, "../../", req.file.path);
  const ext = path.extname(req.file.originalname);

  let usersFromFile = [];

  try {
    // Parse Excel
    if (ext === ".xlsx" || ext === ".xls") {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      usersFromFile = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } 
     else {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    // Load existing users
    const existingUsers = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath))
      : [];

    // Map uploaded users
    const processedUsers = await Promise.all(
      usersFromFile.map(async (user) => {
        // Keep existing id if present, otherwise generate new
        const id = user.id || require("uuid").v4();

        // Hash password if provided in plaintext (optional: skip if already hashed)
        let password = user.password ? String(user.password) : "";

        if (password && !password.startsWith("$2b$")) {
          password = await bcrypt.hash(password, 10);
        }

        return {
          id,
          name: user.name || "",
          enterpriseId: user.enterpriseId || "",
          password: password || "",
          gender: user.gender || "",
          location: user.location || "",
          careerLevel: user.careerLevel || "",
          lineManager: user.lineManager || "",
          projectName: user.projectName || "",
          role: user.role || "user",
          status: user.status || "Active",
          capabilityId: user.capabilityId || "",
          franchiseId: user.franchiseId || "",
          profilePic: user.profilePic || "",
          shortDescription: user.shortDescription || "",
          createdAt: user.createdAt || new Date().toISOString(),
        };
      })
    );

    // Merge uploaded users with existing users (replace by id if exists)
    const mergedUsers = [...existingUsers.filter(u => 
      !processedUsers.some(nu => nu.id === u.id)
    ), ...processedUsers];

    // Save back to JSON
    fs.writeFileSync(dataPath, JSON.stringify(mergedUsers, null, 2));

    // Delete temp file
    fs.unlinkSync(filePath);

    res.json({ message: "Users uploaded successfully", count: processedUsers.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error processing file", error: err.message });
  }
};

module.exports = { uploadUsers };