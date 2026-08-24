const path = require("path");
const { readJSON, writeJSON } = require("../utils/fileHelper");
const { v4: uuidv4 } = require("uuid");

const filePath = path.join(__dirname, "../../data/capabilities.json");

exports.getAll = () => readJSON(filePath);

exports.create = (name) => {
  const capabilities = readJSON(filePath);
  const newCap = { id: uuidv4(), name, createdAt: new Date().toISOString() };
  capabilities.push(newCap);
  writeJSON(filePath, capabilities);
  return newCap;
};

exports.update = (id, name) => {
  const capabilities = readJSON(filePath);
  const idx = capabilities.findIndex(c => c.id === id);
  if (idx === -1) return null;
  capabilities[idx].name = name;
  capabilities[idx].updatedAt = new Date().toISOString();
  writeJSON(filePath, capabilities);
  return capabilities[idx];
};

exports.delete = (id) => {
  const capabilities = readJSON(filePath);
  const filtered = capabilities.filter(c => c.id !== id);
  writeJSON(filePath, filtered);
};