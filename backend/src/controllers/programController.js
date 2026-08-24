const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { readJSON, writeJSON } = require("../utils/fileHelper");

const filePath = path.join(__dirname, "../../data/program.json");

const getPrograms = (req, res) => {
  try {
    res.json(readJSON(filePath));
  } catch (err) {
    res.status(500).json({ error: "Unable to load programs" });
  }
};

const saveProgram = (req, res) => {
  try {
    const programs = readJSON(filePath);
    const newProgram = { ...req.body };
    if (newProgram.id) {
      const index = programs.findIndex((p) => String(p.id) === String(newProgram.id));
      if (index !== -1) programs[index] = newProgram;
      else programs.push(newProgram);
    } else {
      newProgram.id = uuidv4();
      programs.push(newProgram);
    }
    writeJSON(filePath, programs);
    res.json({ success: true, message: "Program saved", program: newProgram });
  } catch (err) {
    console.error("saveProgram error:", err);
    res.status(500).json({ error: "Save failed" });
  }
};

const updateProgram = (req, res) => {
  try {
    const id = req.params.id;
    const programs = readJSON(filePath);
    const index = programs.findIndex((p) => String(p.id) === String(id));
    if (index === -1) return res.status(404).json({ error: "Program not found" });
    programs[index] = { ...programs[index], ...req.body, id: programs[index].id };
    writeJSON(filePath, programs);
    res.json({ success: true, message: "Program updated", program: programs[index] });
  } catch (err) {
    console.error("updateProgram error:", err);
    res.status(500).json({ error: "Update failed" });
  }
};

const deleteProgram = (req, res) => {
  try {
    const id = req.params.id;
    const programs = readJSON(filePath);
    const filtered = programs.filter((p) => String(p.id) !== String(id));
    writeJSON(filePath, filtered);
    res.json({ success: true, message: "Program deleted" });
  } catch (err) {
    console.error("deleteProgram error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
};

module.exports = { getPrograms, saveProgram, updateProgram, deleteProgram };
