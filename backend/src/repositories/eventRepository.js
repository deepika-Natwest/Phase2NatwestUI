const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const filePath = path.join(__dirname, "../../data/events.json");

const readData = () => {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const writeData = (data) =>
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

exports.getAll = () => readData();

exports.create = (data) => {
  const events = readData();
  const newEvent = {
    id: uuidv4(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  events.push(newEvent);
  writeData(events);
  return newEvent;
};

exports.update = (id, updatedData) => {
  const events = readData();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;

  events[index] = {
    ...events[index],
    ...updatedData,
    updatedAt: new Date().toISOString(),
  };

  writeData(events);
  return events[index];
};

exports.delete = (id) => {
  const events = readData();
  const event = events.find((e) => e.id === id);
  if (!event) return null;

  const filtered = events.filter((e) => e.id !== id);
  writeData(filtered);
  return event;
};