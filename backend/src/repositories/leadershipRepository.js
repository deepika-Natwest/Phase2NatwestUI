const path = require("path");
const { readJSON, writeJSON } = require("../utils/fileHelper");
const { v4: uuidv4 } = require("uuid");

const filePath = path.join(__dirname, "../../data/leadership.json");

exports.getAll = () => readJSON(filePath);

exports.create = (data) => {
  const leadership = readJSON(filePath);

  const newItem = {
    id: uuidv4(),
    ...data,
    createdAt: new Date().toISOString()
  };

  leadership.push(newItem);
  writeJSON(filePath, leadership);
  return newItem;
};

exports.update = (id, updatedData) => {
  const leadership = readJSON(filePath);
  const index = leadership.findIndex(l => l.id === id);

  if (index === -1) return null;

  leadership[index] = {
    ...leadership[index],
    ...updatedData,
    updatedAt: new Date().toISOString()
  };

  writeJSON(filePath, leadership);
  return leadership[index];
};

exports.delete = (id) => {
  const leadership = readJSON(filePath);
  const filtered = leadership.filter(l => l.id !== id);
  writeJSON(filePath, filtered);
};