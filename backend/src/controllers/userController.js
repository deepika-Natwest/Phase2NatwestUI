const { v4: uuidv4 } = require('uuid');
const path = require("path");
const fs = require("fs");
const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');

const getUsers = (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const users = userRepository.getAllUsers(search);
    if (page || limit) {
      const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
      const pageSize = Math.max(parseInt(limit, 10) || 50, 1);
      const start = (pageNumber - 1) * pageSize;
      return res.json({
        users: users.slice(start, start + pageSize),
        page: pageNumber, limit: pageSize, total: users.length,
      });
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      name,
      enterpriseId,
      password,
      gender,
      location,
      careerLevel,
      lineManager,
      projectName,
      role,
      status,
      capabilityId,
      franchiseId,
      shortDescription,
      resourceType,
      natwestDoj,
      sowStartDate,
      sowEndDate,
      sowId
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: uuidv4(),
      name,
      enterpriseId,
      password: hashedPassword,
      gender,
      location,
      careerLevel,
      lineManager,
      projectName,
      role,
      status,
      capabilityId,
      franchiseId,
      //profilePic: req.file ? req.file.path : null,
      profilePic: req.file ? req.file.filename : null,
      shortDescription,
      resourceType: resourceType || "",
      natwestDoj: natwestDoj || "",
      sowStartDate: sowStartDate || "",
      sowEndDate: sowEndDate || "",
      sowId: sowId || "",
      createdAt: new Date().toISOString()
    };

    const created = userRepository.createUser(newUser);
    res.status(201).json(created);

  } catch (err) {
    res.status(500).json({ message: 'Error creating user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const users = userRepository.getAllUsers();
    const existing = users.find(u => u.id === id);

    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedData = { ...req.body };

    // Hash password if provided
    if (req.body.password) {
      updatedData.password = await bcrypt.hash(req.body.password, 10);
    }

    // Delete old image if new one uploaded
    if (req.file && existing.profilePic) {
      const oldImagePath = path.join(
        __dirname,
        "../../uploads/users",
        existing.profilePic
      );

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save only filename without extension
    if (req.file) {
      updatedData.profilePic = req.file.filename;
    }

    const updated = userRepository.updateUser(id, updatedData);

    res.json(updated);

  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
};

const deleteUser = (req, res) => {
  try {
    const { id } = req.params;
    userRepository.deleteUser(id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};