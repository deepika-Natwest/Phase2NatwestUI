const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "../data/program.json"
);

const getPrograms = (req, res) => {
  try {
    const data = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: "Unable to load programs",
    });
  }
};

const saveProgram = (req, res) => {
  try {
    const newProgram = req.body;

    const programs = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    if (newProgram.id) {
      const index = programs.findIndex(
        (p) => p.id === newProgram.id
      );

      if (index !== -1) {
        programs[index] = newProgram;
      }
    } else {
      newProgram.id = Date.now();

      programs.push(newProgram);
    }

    fs.writeFileSync(
      filePath,
      JSON.stringify(programs, null, 2)
    );

    res.json({
      success: true,
      message: "Program saved",
    });
  } catch (err) {
    res.status(500).json({
      error: "Save failed",
    });
  }
};

module.exports = {
  getPrograms,
  saveProgram,
};