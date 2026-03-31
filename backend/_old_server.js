const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");

const eventsFilePath = __dirname + "/data/events.json";
const leadershipFilePath = __dirname + "/data/leadership.json";
const loadEventsPublic = () => JSON.parse(fs.readFileSync(eventsFilePath, "utf-8"));
const loadLeadershipPublic = () => JSON.parse(fs.readFileSync(leadershipFilePath, "utf-8"));



const app = express();
const PORT = 5000;
const JWT_SECRET = "your_jwt_secret"; // Change this in production

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));


// Load and save users from JSON
const usersFilePath = __dirname + "/data/users.json";
const loadUsers = () => {
  if (!fs.existsSync(usersFilePath)) return [];
  return JSON.parse(fs.readFileSync(usersFilePath, "utf-8"));
};
const saveUsers = (users) => fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));


// Load and save Leadership from JSON

// ===== PUBLIC LEADERSHIP =====
app.get("/api/public/leadership", (req, res) => {
  const leadership = loadLeadershipPublic();
  res.json(leadership);
});


const loadLeadership = () => {
  if (!fs.existsSync(leadershipFilePath)) return [];
  return JSON.parse(fs.readFileSync(leadershipFilePath, "utf-8"));
};

const saveLeadership = (data) =>
  fs.writeFileSync(leadershipFilePath, JSON.stringify(data, null, 2));


// ===== Login Endpoint =====
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", username, password);

  const users = loadUsers();
  const user = users.find((u) => u.username === username);

  if (!user) return res.status(401).json({ message: "Invalid username or password" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid username or password" });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ token, role: user.role, username: user.username });
});

// ===== Auth Middleware =====
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ===== Role Middleware =====
const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

// ===== Dashboard Example =====
app.get("/api/dashboard", authMiddleware, roleMiddleware(["ADMIN", "EDITOR", "VIEWER"]), (req, res) => {
  res.json({ message: `Welcome ${req.user.username}, your role is ${req.user.role}` });
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });


// ===== Users Routes =====

// Get all users (ADMIN only)
app.get("/api/users", authMiddleware, roleMiddleware(["ADMIN"]), (req, res) => {
  const users = loadUsers();
  res.json(users);
});

// Add user (ADMIN only)
app.post("/api/users", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  const { firstName, lastName, username, password, role } = req.body;

  if (!firstName || !lastName || !username || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const users = loadUsers();
  const exists = users.find((u) => u.username === username);
  if (exists) return res.status(400).json({ message: "Username already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    firstName,
    lastName,
    username,
    password: hashedPassword,
    role,
  };

  users.push(newUser);
  saveUsers(users);

  res.json({ message: "User added successfully", user: newUser });
});

// Update user (ADMIN only)
app.put("/api/users/:id", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, username, password, role } = req.body;

  const users = loadUsers();
  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1) return res.status(404).json({ message: "User not found" });

  // Check if username is being updated to an existing username
  if (username && users.some((u) => u.username === username && u.id !== id)) {
    return res.status(400).json({ message: "Username already exists" });
  }

  const user = users[userIndex];
  users[userIndex] = {
    ...user,
    firstName: firstName || user.firstName,
    lastName: lastName || user.lastName,
    username: username || user.username,
    role: role || user.role,
    password: password ? await bcrypt.hash(password, 10) : user.password, // only hash if password provided
  };

  saveUsers(users);
  res.json({ message: "User updated successfully", user: users[userIndex] });
});

// Delete user (ADMIN only)
app.delete("/api/users/:id", authMiddleware, roleMiddleware(["ADMIN"]), (req, res) => {
  const { id } = req.params;
  let users = loadUsers();
  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1) return res.status(404).json({ message: "User not found" });

  users.splice(userIndex, 1);
  saveUsers(users);
  res.json({ message: "User deleted successfully" });
});



// =====Leadership Managerment =====

app.get(
  "/api/leadership",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR", "VIEWER"]),
  (req, res) => {
    const data = loadLeadership();
    res.json(data);
  }
);

// Add Leadership

app.post(
  "/api/leadership",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  upload.single("photo"),
  async (req, res) => {
    const { name, designation, location, description } = req.body;

    if (!name || !designation) {
      return res.status(400).json({ message: "Name and designation required" });
    }

    const data = loadLeadership();

    let photoPath = null;

    if (req.file) {
      const resizedPath = `uploads/resized-${req.file.filename}`;

      await sharp(req.file.path)
        .resize(100, 100)
        .toFile(resizedPath);

      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete original file:", err);
      });
      

      photoPath = `/uploads/resized-${req.file.filename}`;
    }

    const newRecord = {
      id: Date.now().toString(),
      name,
      designation,
      location,
      description,
      photo: photoPath,
    };

    data.push(newRecord);
    saveLeadership(data);

    res.json({ message: "Leadership record added", record: newRecord });
  }
);


// ===== Update Leadership

app.put(
  "/api/leadership/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  upload.single("photo"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, designation, location, description } = req.body;

      const data = loadLeadership();
      const index = data.findIndex((item) => item.id === id);

      if (index === -1)
        return res.status(404).json({ message: "Record not found" });

      let updatedPhoto = data[index].photo;

      if (req.file) {
        // 🔥 DELETE OLD IMAGE SAFELY
        if (updatedPhoto) {
          const oldFileName = updatedPhoto.replace("/uploads/", "");
          const oldFullPath = path.join(__dirname, "uploads", oldFileName);

          if (fs.existsSync(oldFullPath)) {
            fs.unlink(oldFullPath, (err) => {
              if (err) console.error("Old image delete error:", err);
            });
          }
        }

        // 🔥 RESIZE NEW IMAGE
        const newFileName = `resized-${req.file.filename}`;
        const newFullPath = path.join(__dirname, "uploads", newFileName);

        await sharp(req.file.path)
          .resize(100, 100)
          .toFile(newFullPath);

        // 🔥 DELETE ORIGINAL UPLOAD
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Temp image delete error:", err);
        });

        updatedPhoto = `/uploads/${newFileName}`;
      }

      data[index] = {
        ...data[index],
        name: name || data[index].name,
        designation: designation || data[index].designation,
        location: location || data[index].location,
        description: description || data[index].description,
        photo: updatedPhoto,
      };

      saveLeadership(data);

      res.json({ message: "Leadership updated", record: data[index] });

    } catch (err) {
      console.error("UPDATE ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// === Delete Leadership
app.delete(
  "/api/leadership/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res) => {
    try {
      const { id } = req.params;

      let data = loadLeadership();
      const index = data.findIndex((item) => item.id === id);

      if (index === -1)
        return res.status(404).json({ message: "Record not found" });

      const photoPath = data[index].photo;

      if (photoPath) {
        const fileName = photoPath.replace("/uploads/", "");
        const fullPath = path.join(__dirname, "uploads", fileName);

        if (fs.existsSync(fullPath)) {
          fs.unlink(fullPath, (err) => {
            if (err) console.error("Delete image error:", err);
          });
        }
      }

      data.splice(index, 1);
      saveLeadership(data);

      res.json({ message: "Leadership record deleted" });

    } catch (err) {
      console.error("DELETE ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ===== Events management

// ===== PUBLIC EVENTS =====
app.get("/api/public/events", (req, res) => {
  const events = loadEventsPublic();
  res.json(events);
});

const loadEvents = () =>
  JSON.parse(fs.readFileSync(eventsFilePath, "utf-8"));

const saveEvents = (data) =>
  fs.writeFileSync(eventsFilePath, JSON.stringify(data, null, 2));

app.get(
  "/api/events",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR", "VIEWER"]),
  (req, res) => {
    const data = loadEvents();
    res.json(data);
  }
);


// === Add event

app.post(
  "/api/events",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, description, tag, date, location, status } = req.body;

      if (!name || !date)
        return res.status(400).json({ message: "Name and date required" });

      const data = loadEvents();

      let imagePath = null;

      if (req.file) {
        const newFileName = `event-${req.file.filename}`;
        const newFullPath = path.join(__dirname, "uploads", newFileName);

        await sharp(req.file.path)
          .resize(300, 200)
          .toFile(newFullPath);

        fs.unlink(req.file.path, () => {});

        imagePath = `/uploads/${newFileName}`;
      }

      const newEvent = {
        id: Date.now().toString(),
        name,
        description,
        tag,
        date,
        location,
        status: status || "ACTIVE",
        image: imagePath,
        createdAt: new Date()
      };

      data.push(newEvent);
      saveEvents(data);

      res.json({ message: "Event added", record: newEvent });

    } catch (err) {
      console.error("EVENT ADD ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ==== update event

app.put(
  "/api/events/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "EDITOR"]),
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const data = loadEvents();
      const index = data.findIndex((item) => item.id === id);

      if (index === -1)
        return res.status(404).json({ message: "Event not found" });

      let updatedImage = data[index].image;

      if (req.file) {
        if (updatedImage) {
          const oldFile = updatedImage.replace("/uploads/", "");
          const oldPath = path.join(__dirname, "uploads", oldFile);

          if (fs.existsSync(oldPath)) {
            fs.unlink(oldPath, () => {});
          }
        }

        const newFileName = `event-${req.file.filename}`;
        const newFullPath = path.join(__dirname, "uploads", newFileName);

        await sharp(req.file.path)
          .resize(300, 200)
          .toFile(newFullPath);

        fs.unlink(req.file.path, () => {});

        updatedImage = `/uploads/${newFileName}`;
      }

      data[index] = {
        ...data[index],
        ...req.body,
        image: updatedImage
      };

      saveEvents(data);

      res.json({ message: "Event updated", record: data[index] });

    } catch (err) {
      console.error("EVENT UPDATE ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// ==== delete event

app.delete(
  "/api/events/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res) => {
    try {
      const { id } = req.params;
      let data = loadEvents();

      const index = data.findIndex((item) => item.id === id);
      if (index === -1)
        return res.status(404).json({ message: "Event not found" });

      const imagePath = data[index].image;

      if (imagePath) {
        const fileName = imagePath.replace("/uploads/", "");
        const fullPath = path.join(__dirname, "uploads", fileName);

        if (fs.existsSync(fullPath)) {
          fs.unlink(fullPath, () => {});
        }
      }

      data.splice(index, 1);
      saveEvents(data);

      res.json({ message: "Event deleted" });

    } catch (err) {
      console.error("EVENT DELETE ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// ===== Start Server =====
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
