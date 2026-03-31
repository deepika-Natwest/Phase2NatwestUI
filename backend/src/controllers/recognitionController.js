const recognitionRepo = require("../repositories/recognitionRepository");
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "../../uploads/recognitions");

exports.getAllRecognitions = (req, res) => {
  res.json(recognitionRepo.getAll());
};

exports.createRecognition = (req, res) => {
  const data = {
    name: req.body.name,
    designation: req.body.designation,
    location: req.body.location,
    recognitionType: req.body.recognitionType,
    recognitionTag: req.body.recognitionTag,
    shortDescription: req.body.shortDescription,
    pic: req.file ? req.file.filename : null,
  };

  const newRecog = recognitionRepo.create(data);
  res.status(201).json(newRecog);
};

exports.updateRecognition = (req, res) => {
  const existing = recognitionRepo.getAll().find(r => r.id === req.params.id);
  if (!existing) return res.status(404).json({ message: "Not found" });

  let pic = existing.pic;

  if (req.file) {
    if (existing.pic) {
      const oldPath = path.join(uploadDir, existing.pic);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    pic = req.file.filename;
  }

  const updated = recognitionRepo.update(req.params.id, {
    ...req.body,
    pic,
  });

  res.json(updated);
};

exports.deleteRecognition = (req, res) => {
  const deleted = recognitionRepo.delete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Not found" });

  if (deleted.pic) {
    const imgPath = path.join(uploadDir, deleted.pic);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  res.status(204).send();
};