const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const filePath = path.join(__dirname, "../../data/user-statuses.json");

const readData  = () => JSON.parse(fs.readFileSync(filePath, "utf-8"));
const writeData = (data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

// GET all user statuses
router.get("/", (req, res) => {
  res.json(readData());
});

// POST create
router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
  const data = readData();
  const newStatus = { id: uuidv4(), name: name.trim() };
  data.push(newStatus);
  writeData(data);
  res.status(201).json(newStatus);
});

// PUT update
router.put("/:id", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
  const data = readData();
  const idx = data.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "User status not found" });
  data[idx].name = name.trim();
  writeData(data);
  res.json(data[idx]);
});

// DELETE
router.delete("/:id", (req, res) => {
  const data = readData().filter((s) => s.id !== req.params.id);
  writeData(data);
  res.status(204).send();
});

module.exports = router;
