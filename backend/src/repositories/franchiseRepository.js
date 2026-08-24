// backend/src/repositories/franchiseRepository.js
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const franchiseFile = path.join(__dirname, "../../data/franchises.json");
const capabilitiesFile = path.join(__dirname, "../../data/capabilities.json");

// Helper functions
const readJSON = (franchiseFile) => (fs.existsSync(franchiseFile) ? JSON.parse(fs.readFileSync(franchiseFile, "utf-8")) : []);
const writeJSON = (franchiseFile, data) => fs.writeFileSync(franchiseFile, JSON.stringify(data, null, 2));

// Franchise CRUD
exports.getAll = () => readJSON(franchiseFile);

exports.getByCapability = (capabilityId) => {
  const franchises = readJSON(franchiseFile);
  return franchises.filter((f) => f.capabilityId === capabilityId);
};

exports.create = (name, capabilityId) => {
  const capabilities = readJSON(capabilitiesFile);
  if (!capabilities.find((c) => c.id === capabilityId)) throw new Error("Invalid capabilityId");

  const franchises = readJSON(franchiseFile);
  const newFranchise = { id: uuidv4(), name, capabilityId };
  franchises.push(newFranchise);
  writeJSON(franchiseFile, franchises);
  return newFranchise;
};

exports.update = (id, name, capabilityId) => {
  const franchises = readJSON(franchiseFile);
  const idx = franchises.findIndex((f) => f.id === id);
  if (idx === -1) return null;

  if (name) franchises[idx].name = name;
  if (capabilityId) franchises[idx].capabilityId = capabilityId;

  writeJSON(franchiseFile, franchises);
  return franchises[idx];
};

exports.delete = (id) => {
  const franchises = readJSON(franchiseFile);
  const filtered = franchises.filter((f) => f.id !== id);
  writeJSON(franchiseFile, filtered);
};

exports.getCapabilities = () => readJSON(capabilitiesFile);