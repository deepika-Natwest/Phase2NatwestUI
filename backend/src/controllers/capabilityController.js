const capabilityRepo = require("../repositories/capabilityRepository");

exports.getAllCapabilities = (req, res) => {
  res.json(capabilityRepo.getAll());
};

exports.createCapability = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });
  const newCap = capabilityRepo.create(name.trim());
  res.status(201).json(newCap);
};

exports.updateCapability = (req, res) => {
  const { name } = req.body;
  const updated = capabilityRepo.update(req.params.id, name.trim());
  if (!updated) return res.status(404).json({ message: "Capability not found" });
  res.json(updated);
};

exports.deleteCapability = (req, res) => {
  capabilityRepo.delete(req.params.id);
  res.status(204).send();
};