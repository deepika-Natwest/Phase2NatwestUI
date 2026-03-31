const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const filePath = path.join(__dirname, "../../data/capabilities.json");

const readData = () => JSON.parse(fs.readFileSync(filePath, "utf-8"));
const writeData = (data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

router.get("/", (req, res) => {
  res.json(readData());
});

router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });
  const data = readData();
  const newCap = { id: uuidv4(), name };
  data.push(newCap);
  writeData(data);
  res.status(201).json(newCap);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const data = readData();
  const idx = data.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ message: "Not found" });
  data[idx].name = name;
  writeData(data);
  res.json(data[idx]);
});

router.delete("/:id", (req, res) => {
  let data = readData();
  data = data.filter(c => c.id !== req.params.id);
  writeData(data);
  res.status(204).send();
});

module.exports = router;