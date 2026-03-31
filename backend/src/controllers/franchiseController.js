// backend/src/controllers/franchiseController.js
const franchiseRepo = require("../repositories/franchiseRepository");

exports.getAllFranchises = (req, res) => {
  try {
    const { capabilityId } = req.query;

    // 🔥 If capabilityId exists → filter
    if (capabilityId) {
      return res.json(franchiseRepo.getByCapability(capabilityId));
    }

    // Otherwise return all
    res.json(franchiseRepo.getAll());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load franchises" });
  }
};

exports.createFranchise = (req, res) => {
  try {
    const { name, capabilityId } = req.body;

    if (!name || !capabilityId) {
      return res.status(400).json({
        message: "Name and capabilityId required",
      });
    }

    const newFranchise = franchiseRepo.create(name, capabilityId);
    res.status(201).json(newFranchise);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateFranchise = (req, res) => {
  try {
    const { id } = req.params;
    const { name, capabilityId } = req.body;

    const updated = franchiseRepo.update(id, name, capabilityId);

    if (!updated) {
      return res.status(404).json({ message: "Franchise not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteFranchise = (req, res) => {
  try {
    franchiseRepo.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getCapabilities = (req, res) => {
  try {
    res.json(franchiseRepo.getCapabilities());
  } catch (err) {
    res.status(500).json({ message: "Failed to load capabilities" });
  }
};

exports.getFranchisesByCapability = (req, res) => {
  try {
    const { capabilityId } = req.query;
    if (!capabilityId) return res.json([]); // return empty array if not provided
    const franchises = franchiseRepo.getByCapability(capabilityId);
    res.json(franchises);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get franchises" });
  }
};