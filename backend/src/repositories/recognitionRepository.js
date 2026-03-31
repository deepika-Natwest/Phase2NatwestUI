const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const filePath = path.join(__dirname, "../../data/recognitions.json");

const readData = () => {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const writeData = (data) =>
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

exports.getAll = () => readData();

exports.create = (data) => {
  const recognitions = readData();
  const newRecog = {
    id: uuidv4(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  recognitions.push(newRecog);
  writeData(recognitions);
  return newRecog;
};

exports.update = (id, updatedData) => {
  const recognitions = readData();
  const index = recognitions.findIndex((r) => r.id === id);
  if (index === -1) return null;

  recognitions[index] = {
    ...recognitions[index],
    ...updatedData,
    updatedAt: new Date().toISOString(),
  };

  writeData(recognitions);
  return recognitions[index];
};

exports.delete = (id) => {
  const recognitions = readData();
  const rec = recognitions.find((r) => r.id === id);
  if (!rec) return null;

  const filtered = recognitions.filter((r) => r.id !== id);
  writeData(filtered);
  return rec;
};