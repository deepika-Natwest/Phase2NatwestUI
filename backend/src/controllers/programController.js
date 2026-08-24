const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const filePath = path.join(__dirname, "../../data/program.json");

const readData = () => {
  try {
    const raw = fs.readFileSync(filePath, "utf8").trim();
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeData = (data) =>
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

const getPrograms = (req, res) => {
  try {
    res.json(readData());
  } catch (err) {
    res.status(500).json({ error: "Unable to load programs" });
  }
};

const createProgram = (req, res) => {
  try {
    const { name, capabilityId, franchiseId, description, date } = req.body;
    if (!name) return res.status(400).json({ message: "Program name is required" });
    const programs = readData();
    const newProgram = {
      id: crypto.randomUUID(),
      name,
      capabilityId: capabilityId || "",
      franchiseId: franchiseId || "",
      description: description || "",
      date: date || "",
      createdAt: new Date().toISOString(),
    };
    programs.push(newProgram);
    writeData(programs);
    res.status(201).json(newProgram);
  } catch (err) {
    res.status(500).json({ error: "Failed to create program" });
  }
};

const updateProgram = (req, res) => {
  try {
    const { id } = req.params;
    const programs = readData();
    const index = programs.findIndex((p) => p.id === id);
    if (index === -1) return res.status(404).json({ message: "Program not found" });
    programs[index] = {
      ...programs[index],
      ...req.body,
      id,
      updatedAt: new Date().toISOString(),
    };
    writeData(programs);
    res.json(programs[index]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update program" });
  }
};

const deleteProgram = (req, res) => {
  try {
    const { id } = req.params;
    const programs = readData();
    const filtered = programs.filter((p) => p.id !== id);
    writeData(filtered);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete program" });
  }
};

module.exports = { getPrograms, createProgram, updateProgram, deleteProgram };
