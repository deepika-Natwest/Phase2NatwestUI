const fs = require("fs");
const path = require("path");
const leadershipRepo = require("../repositories/leadershipRepository");
//const { LOCATION_OPTIONS } = require("../config/userConfig");

exports.getAllLeadership = (req, res) => {
  res.json(leadershipRepo.getAll());
};

exports.createLeadership = (req, res) => {
  const { name, managementLevel, designation, location, shortDescription } = req.body;

  if (!name || !designation ) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  const newItem = leadershipRepo.create({
    name: name.trim(),
    managementLevel: managementLevel.trim(),
    designation: designation.trim(),
    location,
    shortDescription: shortDescription?.trim() || "",
    profilePic: req.file ? req.file.filename : null
  });

  res.status(201).json(newItem);
};

exports.updateLeadership = (req, res) => {
  const { name,managementLevel, designation, location, shortDescription } = req.body;

  const leadershipList = leadershipRepo.getAll();
  const existing = leadershipList.find(l => l.id === req.params.id);

  if (!existing) {
    return res.status(404).json({ message: "Leadership not found" });
  }

  // If new image uploaded → delete old one
  if (req.file && existing.profilePic) {
    const oldImagePath = path.join(
      __dirname,
      "../../uploads/leadership",
      path.basename(existing.profilePic)
    );

    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
  }

  const updated = leadershipRepo.update(req.params.id, {
    name: name?.trim(),
    managementLevel: managementLevel.trim(),
    designation: designation?.trim(),
    location,
    shortDescription: shortDescription?.trim(),
    ...(req.file && { profilePic: `leadership/${req.file.filename}` })
  });

  res.json(updated);
};
exports.deleteLeadership = (req, res) => {
  const leadershipList = leadershipRepo.getAll();
  const existing = leadershipList.find(l => l.id === req.params.id);

  if (!existing) {
    return res.status(404).json({ message: "Not found" });
  }

  if (existing.profilePic) {
    const imagePath = path.join(
      __dirname,
      "../../uploads/leadership",
      path.basename(existing.profilePic)
    );

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  leadershipRepo.delete(req.params.id);
  res.status(204).send();
};