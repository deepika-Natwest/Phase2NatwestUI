const { v4: uuid } = require("uuid");
const repo = require("../repositories/deliverableRepository");

exports.getDeliverables = (req, res) => {
  const data = repo.getAll();
  res.json(data);
};

exports.createDeliverable = (req, res) => {
  const {
    capabilityId,
    franchiseId,
    category,
    aiBased,
    projectName,
    description,
    resources,
  } = req.body;

  const newDeliverable = {
    id: uuid(),
    capabilityId,
    franchiseId,
    category,
    aiBased: aiBased === "true" || aiBased === true,
    projectName,
    description,
    resources: Array.isArray(resources) ? resources : [resources],
    createdAt: new Date(),
  };

  const saved = repo.create(newDeliverable);

  res.status(201).json(saved);
};

exports.updateDeliverable = (req, res) => {
  const id = req.params.id;

  const updated = repo.update(id, req.body);

  if (!updated) {
    return res.status(404).json({ message: "Deliverable not found" });
  }

  res.json(updated);
};

exports.deleteDeliverable = (req, res) => {
  const id = req.params.id;

  repo.remove(id);

  res.json({ message: "Deleted successfully" });
};