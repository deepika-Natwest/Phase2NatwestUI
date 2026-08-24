const eventRepo = require("../repositories/eventRepository");
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "../../uploads/events");

exports.getAllEvents = (req, res) => {
  res.json(eventRepo.getAll());
};

exports.createEvent = (req, res) => {
  const eventData = {
    eventName: req.body.eventName,
    date: req.body.date,
    tag: req.body.tag,
    location: req.body.location,
    description: req.body.description,
    status: req.body.status,
    eventImage: req.file ? req.file.filename : null,
  };

  const newEvent = eventRepo.create(eventData);
  res.status(201).json(newEvent);
};

exports.updateEvent = (req, res) => {
  const existing = eventRepo.getAll().find(e => e.id === req.params.id);
  if (!existing) return res.status(404).json({ message: "Not found" });

  let eventImage = existing.eventImage;

  if (req.file) {
    // delete old image
    if (existing.eventImage) {
      const oldPath = path.join(uploadDir, existing.eventImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    eventImage = req.file.filename;
  }

  const updated = eventRepo.update(req.params.id, {
    ...req.body,
    eventImage,
  });

  res.json(updated);
};

exports.deleteEvent = (req, res) => {
  const deleted = eventRepo.delete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Not found" });

  if (deleted.eventImage) {
    const imgPath = path.join(uploadDir, deleted.eventImage);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  res.status(204).send();
};