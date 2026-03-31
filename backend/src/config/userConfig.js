const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

const CAREER_LEVELS = Array.from({ length: 12 }, (_, i) => ({
  label: `Level ${i + 1}`,
  value: `Level ${i + 1}`,
}));

const RECOGNITION_TYPES = ["Employee of the Month", "Team Player", "Innovation Award", "Leadership Award"];

const LOCATIONS = ["Pune", "Mumbai", "London", "Bangalore"];

module.exports = {
  GENDER_OPTIONS,
  CAREER_LEVELS,
  LOCATIONS,
  RECOGNITION_TYPES
};