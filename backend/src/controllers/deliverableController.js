const { v4: uuid } = require("uuid");
const repo = require("../repositories/deliverableRepository");

/* -----------------------------------------
   GET ALL DELIVERABLES (Public + Admin)
------------------------------------------ */
exports.getDeliverables = (req, res) => {
  const data = repo.getAll();
  res.json(data);
};

/* -----------------------------------------
   CREATE DELIVERABLE
------------------------------------------ */
exports.createDeliverable = (req, res) => {
  const {
    capabilityId,
    franchiseId,
    category,
    aiBased,
    projectName,
    description,
    resources,

    // ✅ category-specific fields
    costSavingAmount,
    costSavingCurrency,
    timeHours,
    timeMinutes,
    newFunctionality,
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

    // ✅ Save category-based data
    costSavingAmount:
      category === "Cost Saving" ? costSavingAmount : null,
    costSavingCurrency:
      category === "Cost Saving" ? costSavingCurrency : null,

    timeHours:
      category === "Process Improvement" ? timeHours : null,
    timeMinutes:
      category === "Process Improvement" ? timeMinutes : null,

    newFunctionality:
      category === "New Functionality" ? newFunctionality : null,

    createdAt: new Date(),
  };

  const saved = repo.create(newDeliverable);
  res.status(201).json(saved);
};

/* -----------------------------------------
   UPDATE DELIVERABLE
------------------------------------------ */
exports.updateDeliverable = (req, res) => {
  const id = req.params.id;

  const updated = repo.update(id, {
    ...req.body,

    // ✅ Ensure category cleanup on update
    costSavingAmount:
      req.body.category === "Cost Saving"
        ? req.body.costSavingAmount
        : null,

    costSavingCurrency:
      req.body.category === "Cost Saving"
        ? req.body.costSavingCurrency
        : null,

    timeHours:
      req.body.category === "Process Improvement"
        ? req.body.timeHours
        : null,

    timeMinutes:
      req.body.category === "Process Improvement"
        ? req.body.timeMinutes
        : null,

    newFunctionality:
      req.body.category === "New Functionality"
        ? req.body.newFunctionality
        : null,
  });

  if (!updated) {
    return res.status(404).json({ message: "Deliverable not found" });
  }

  res.json(updated);
};

/* -----------------------------------------
   DELETE DELIVERABLE
------------------------------------------ */
exports.deleteDeliverable = (req, res) => {
  const id = req.params.id;
  repo.remove(id);
  res.json({ message: "Deleted successfully" });
};