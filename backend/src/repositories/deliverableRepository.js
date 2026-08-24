const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../data/deliverables.json");

function readData() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(filePath));
}

function writeData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getAll() {
  return readData();
}

function getById(id) {
  return readData().find((d) => d.id === id);
}

function create(deliverable) {
  const data = readData();
  data.push(deliverable);
  writeData(data);
  return deliverable;
}

function update(id, updated) {
  const data = readData();
  const index = data.findIndex((d) => d.id === id);

  if (index === -1) return null;

  data[index] = { ...data[index], ...updated };
  writeData(data);

  return data[index];
}

function remove(id) {
  const data = readData().filter((d) => d.id !== id);
  writeData(data);
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};