const fs = require("fs");
const path = require("path");
const { search: searchVectorIndex } = require("./vectorStore");

const DATA_DIR = path.join(__dirname, "../../data");
const PRICING_FILE = path.join(DATA_DIR, "pricing.json");
const DASHBOARD_FILE = path.join(DATA_DIR, "public-dashboard.json");

const TAB_LABELS = {
  users: "Users",
  leadership: "Leadership",
  events: "Events",
  deliverables: "Deliverables",
  recognitions: "Recognitions",
  capabilities: "Capabilities",
  franchises: "Franchises",
  program: "Programs",
};

const STATUS_ALIASES = {
  inactive: "Inactive",
  active: "Active",
  "on leave": "On Leave",
};

const VALUE_ALIASES = {
  "data and ai": ["d&a", "d&a+", "data & ai", "data and analytics"],
  "d&a": ["d&a", "d&a+", "data & ai", "data and analytics"],
  bangalore: ["bangalore", "bengaluru", "banglore"],
};

const MONTH_ALIASES = { january: "jan", february: "feb", march: "mar", april: "apr", may: "may", june: "jun", july: "jul", august: "aug", september: "sep", october: "oct", november: "nov", december: "dec" };

const SENSITIVE_FIELDS = new Set(["password", "token", "secret", "hash"]);

function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsTerm(text, term) {
  return new RegExp(`(^|\\s)${term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}($|\\s)`).test(normalize(text));
}

function getFileContent(filePath) {
  try {
    const file = fs.readFileSync(filePath, "utf-8");
    if (!file || !file.trim()) return [];
    return JSON.parse(file);
  } catch (error) {
    return [];
  }
}

function getPricingDocuments() {
  const pricing = getFileContent(PRICING_FILE);
  if (!pricing || typeof pricing !== "object" || Array.isArray(pricing)) return [];

  return Object.entries(pricing).flatMap(([table, rows]) => {
    if (!Array.isArray(rows)) return [];

    return rows.map((row) => {
      const category = row.category || "Pricing record";
      const values = Object.entries(row)
        .filter(([field]) => field !== "id" && field !== "category")
        .map(([field, value]) => `${field}: ${value}`)
        .join(" ");

      return {
        tab: "Pricing",
        title: category,
        text: `Tab: Pricing Table: ${table} Category: ${category} ${values}`,
        raw: { ...row, table },
      };
    });
  });
}

function flatValue(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(flatValue).join(" ");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, innerValue]) => `${key} ${flatValue(innerValue)}`)
      .join(" ");
  }
  return String(value);
}

function humanizeField(field) {
  return String(field)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase();
}

function buildKnowledgeBase() {
  const docs = [];
  const fileNames = Object.entries(TAB_LABELS);

  for (const [key, label] of fileNames) {
    const filePath = path.join(DATA_DIR, `${key}.json`);
    const items = getFileContent(filePath);
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      const title = item.name || item.eventName || item.projectName || item.title || item.designation || item.deliveryTitle || item.capability || item.enterpriseId || "Record";
      const text = [
        `Tab: ${label}`,
        `Title: ${title}`,
        ...Object.entries(item)
          .filter(([field]) => !SENSITIVE_FIELDS.has(field.toLowerCase()))
          .map(([field, value]) => `${humanizeField(field)}: ${flatValue(value)}`),
      ].join(" ");

      docs.push({
        tab: label,
        title,
        text,
        raw: item,
      });
    }
  }

  return [...docs, ...getPricingDocuments()];
}

function answerPricingQuestion(question) {
  const normalizedQuestion = normalize(question);
  if (!normalizedQuestion.includes("grand total") || !normalizedQuestion.includes("d a")) return null;

  const pricing = getFileContent(PRICING_FILE);
  const totals = Object.entries(pricing || {}).map(([table, rows]) => {
    const row = Array.isArray(rows) && rows.find((item) => normalize(item.category).replace(/\s+/g, "") === "da");
    if (!row) return { table, total: 0 };

    const total = Object.entries(row)
      .filter(([field]) => field !== "id" && field !== "category" && Number.isFinite(Number(row[field])))
      .reduce((sum, [, value]) => sum + Number(value), 0);
    return { table, total };
  });

  const grandTotal = totals.reduce((sum, item) => sum + item.total, 0);
  return `The grand total for D&A+ across all pricing tables is ${grandTotal} (expiry: ${totals.find((item) => item.table === "expiry")?.total || 0}, attrition: ${totals.find((item) => item.table === "attrition")?.total || 0}, extension: ${totals.find((item) => item.table === "extension")?.total || 0}).`;
}

function answerPricingMetricQuestion(question) {
  const normalizedQuestion = normalize(question);
  if (!/(pricing|expiry|attrition|roll off|extension|future ending|planned release|fg available|fg not available)/.test(normalizedQuestion)) return null;
  const pricing = getFileContent(PRICING_FILE);
  const categories = Object.values(pricing || {}).flat().filter((row) => row && row.category);
  const category = categories.find((row) => {
    const label = normalize(row.category);
    return normalizedQuestion.includes(label) || (label === "d a" && /d a|data and analytics/.test(normalizedQuestion));
  });
  if (!category) return null;
  const table = Object.entries(pricing).find(([, rows]) => rows.includes(category))?.[0];
  const field = Object.keys(category).find((key) => normalizedQuestion.includes(humanizeField(key)));
  if (!field) return null;
  return `${category.category} ${humanizeField(field)} is ${category[field]}${table ? ` in the ${table} table` : ""}.`;
}

function answerUsersByLocation(question, knowledge) {
  const normalizedQuestion = normalize(question);
  const userDocs = knowledge.filter((doc) => doc.tab === "Users" && doc.raw && doc.raw.location);
  const locations = [...new Set(userDocs.map((doc) => normalize(doc.raw.location)).filter(Boolean))].sort((a, b) => b.length - a.length);
  const location = locations.find((candidate) => {
    const aliases = VALUE_ALIASES[candidate] || [candidate];
    return aliases.some((alias) => new RegExp(`\\b${normalize(alias).replace(/ /g, "\\s+")}\\b`).test(normalizedQuestion));
  });
  if (!location) return null;
  if (!/(list|show|who|users|people|employees|how many|count)/.test(normalizedQuestion)) return null;

  const aliases = VALUE_ALIASES[location] || [location];
  const matches = userDocs.filter((doc) => aliases.includes(normalize(doc.raw.location)));
  if (!matches.length) return `No users were found in ${location}.`;
  if (/(how many|count|number of)/.test(normalizedQuestion)) return `${matches.length} users are in ${location}.`;

  const names = matches.map((doc) => doc.raw.name || doc.raw.enterpriseId).join(", ");
  return `${matches.length} users are in ${location}: ${names}.`;
}

function answerUsersByStatus(question, knowledge) {
  const normalizedQuestion = normalize(question);
  const status = Object.entries(STATUS_ALIASES).find(([alias]) => new RegExp(`\\b${alias.replace(/ /g, "\\s+")}\\b`).test(normalizedQuestion))?.[1];
  if (!status || !/(user|users|people|employees|staff|who|list|show|how many|count)/.test(normalizedQuestion)) return null;

  const matches = knowledge
    .filter((doc) => doc.tab === "Users" && normalize(doc.raw?.status) === normalize(status));
  if (/(how many|count|number of)/.test(normalizedQuestion)) return `${matches.length} users have status ${status}.`;
  const names = matches.map((doc) => doc.raw.name || doc.raw.enterpriseId).filter(Boolean).join(", ");
  return matches.length ? `${matches.length} users have status ${status}: ${names}.` : `No users have status ${status}.`;
}

function answerUsersByProject(question, knowledge) {
  const normalizedQuestion = normalize(question);
  if (!/(users|people|employees|staff).*(work|assigned|on|in)|who.*(work|assigned)/.test(normalizedQuestion)) return null;
  const userDocs = knowledge.filter((doc) => doc.tab === "Users" && doc.raw?.projectName);
  const project = userDocs.map((doc) => normalize(doc.raw.projectName)).filter((name) => name && name !== "na")
    .sort((left, right) => right.length - left.length).find((name) => normalizedQuestion.includes(name));
  if (!project) return null;
  const matches = userDocs.filter((doc) => normalize(doc.raw.projectName) === project);
  return matches.length ? `${matches.length} users work on ${matches[0].raw.projectName}: ${matches.map((doc) => doc.raw.name).filter(Boolean).join(", ")}.` : `No users work on ${project}.`;
}

function answerDashboardQuestion(question) {
  const normalizedQuestion = normalize(question);
  const dashboard = getFileContent(DASHBOARD_FILE);
  if (!dashboard || typeof dashboard !== "object" || Array.isArray(dashboard)) return null;

  if (/(total headcount|current headcount|current hc|how many resources|total resources)/.test(normalizedQuestion)) {
    const value = dashboard.currentHC ?? dashboard.summary?.totalResources;
    return `The current headcount is ${value}.`;
  }

  const utilizationMonth = normalizedQuestion.match(/utili[sz]ation(?: in| for)? ([a-z]+)(?:\s+\d{4})?/);
  if (utilizationMonth) {
    const month = MONTH_ALIASES[utilizationMonth[1]] || utilizationMonth[1];
    const row = (dashboard.utilizationTrendData || []).find((item) => normalize(item.month) === month);
    return row ? `Utilization in ${row.month} is ${row.utilization}%.` : `No utilization data was found for ${month}.`;
  }

  if (/(billable headcount|billable hc)/.test(normalizedQuestion)) {
    return `Billable headcount is ${dashboard.summary?.billableHC}.`;
  }
  if (/(timesheet compliance|timesheets)/.test(normalizedQuestion)) {
    return `Timesheet compliance is ${dashboard.summary?.timesheetCompliance}.`;
  }
  if (/(leakage hours|leakage)/.test(normalizedQuestion) && !/(which|what type|breakdown)/.test(normalizedQuestion)) {
    return `Leakage is ${dashboard.summary?.leakageHours} hours.`;
  }
  return null;
}

function answerLeadershipList(question, knowledge) {
  const normalizedQuestion = normalize(question);
  if (!/(leadership|leaders|leadership team)/.test(normalizedQuestion) || !/(list|show|who|members|all)/.test(normalizedQuestion)) return null;
  const level = normalizedQuestion.includes("leadership team") ? "Leadership Team" : null;
  const records = knowledge.filter((doc) => doc.tab === "Leadership" && (!level || doc.raw.managementLevel === level));
  const names = records.map((doc) => doc.raw.name).filter(Boolean).join(", ");
  return records.length ? `${records.length} leadership members${level ? ` in ${level}` : ""}: ${names}.` : "No leadership members were found.";
}

function answerEventsByStatus(question, knowledge) {
  const normalizedQuestion = normalize(question);
  const status = ["Upcoming", "Active", "Completed", "Cancelled", "Postponed"]
    .find((value) => normalizedQuestion.includes(normalize(value)));
  if (!status || !/(event|events)/.test(normalizedQuestion) || !/(which|what|list|show|all)/.test(normalizedQuestion)) return null;
  const matches = knowledge.filter((doc) => doc.tab === "Events" && normalize(doc.raw.status) === normalize(status));
  return matches.length ? `${matches.length} ${status.toLowerCase()} events: ${matches.map((doc) => doc.raw.eventName).join(", ")}.` : `No ${status.toLowerCase()} events were found.`;
}

function answerRecognitionQuestion(question, knowledge) {
  const normalizedQuestion = normalize(question);
  if (!/(recognition|award|awarded|honored|honour)/.test(normalizedQuestion)) return null;
  const matches = knowledge.filter((doc) => doc.tab === "Recognitions" && doc.raw?.name && normalizedQuestion.includes(normalize(doc.raw.name)));
  if (!matches.length) return null;
  return matches.map((doc) => {
    const raw = doc.raw;
    const details = [raw.recognitionType, raw.recognitionTag, raw.shortDescription].filter(Boolean).join("; ");
    return `${raw.name}: ${details || "recognition recorded"}`;
  }).join(" ");
}

function answerDomainListQuestion(question) {
  const normalizedQuestion = normalize(question);
  const asksForDomain = /(domain|domains|area|areas|service|services|vertical|verticals)/.test(normalizedQuestion);
  const asksForList = /(what|which|list|show|all)/.test(normalizedQuestion);
  if (!asksForDomain || !asksForList) return null;

  const domains = [
    "Retail Banking",
    "Wealth",
    "Commercial and Institutional Banking",
    "NatWest Markets",
    "Treasury",
    "RBSI",
    "BAS (Business Automation Services)",
    "Architecture & Engineering",
    "Economic Crime & Fraud",
    "Infrastructure & Security",
    "FRAL",
  ];

  return `The main domains and service areas shown in the app are: ${domains.join(", ")}.`;
}

function answerRetailBankingSupportQuestion(question) {
  const normalizedQuestion = normalize(question);
  const retailBankingMentioned = /(retail banking)/.test(normalizedQuestion);
  const accentureHelps = /(accenture|accenture helps|helps in|help.*retail banking|support.*retail banking)/.test(normalizedQuestion);
  if (!retailBankingMentioned || !accentureHelps) return null;

  return "In Retail Banking, Accenture helps the bank provide a range of banking products and related financial services, including CASA, mortgages, and unsecured lending through credit cards and loans.";
}

function answerCapabilityQuestion(question, knowledge) {
  const normalizedQuestion = normalize(question);
  if (!/(capability|franchise|team).*(under|belong|contain|associated)|what.*(capability|franchises)/.test(normalizedQuestion)) return null;
  const capabilities = knowledge.filter((doc) => doc.tab === "Capabilities");
  const capability = capabilities.find((doc) => normalizedQuestion.includes(normalize(doc.raw.name)) || (normalize(doc.raw.name) === "data ai" && /d a|data and analytics/.test(normalizedQuestion)));
  if (!capability) return null;
  const franchises = knowledge.filter((doc) => doc.tab === "Franchises" && doc.raw.capabilityId === capability.raw.id);
  return franchises.length ? `${capability.raw.name} contains ${franchises.length} franchises: ${franchises.map((doc) => doc.raw.name).join(", ")}.` : `${capability.raw.name} has no franchises recorded.`;
}

function answerProgramsByFranchise(question, knowledge) {
  const normalizedQuestion = normalize(question);
  if (!/(program|programs)/.test(normalizedQuestion) || !/(belong|under|in|for|associated)/.test(normalizedQuestion)) return null;
  const franchises = [...new Set(knowledge.filter((doc) => doc.tab === "Programs").map((doc) => normalize(doc.raw.franchiseId)).filter(Boolean))];
  const franchise = franchises.find((candidate) => (VALUE_ALIASES[candidate] || [candidate]).some((alias) => normalizedQuestion.includes(normalize(alias))));
  if (!franchise) return null;
  const records = knowledge.filter((doc) => doc.tab === "Programs" && normalize(doc.raw.franchiseId) === franchise);
  return records.length ? `${records.length} programs belong to ${franchise}: ${records.map((doc) => doc.raw.name).join(", ")}.` : `No programs belong to ${franchise}.`;
}

function answerDeliverableFilter(question, knowledge) {
  const normalizedQuestion = normalize(question);
  if (!/(deliverable|deliverables)/.test(normalizedQuestion)) return null;
  let records = knowledge.filter((doc) => doc.tab === "Deliverables");
  if (/ai based|ai based|using ai|artificial intelligence/.test(normalizedQuestion)) records = records.filter((doc) => doc.raw.aiBased === true);
  else return null;
  return records.length ? `${records.length} AI-based deliverables: ${records.map((doc) => doc.raw.deliveryTitle || doc.raw.projectName).join(", ")}.` : "No AI-based deliverables were found.";
}

function answerNextEvent(question, knowledge) {
  const normalizedQuestion = normalize(question);
  if (!/(next|upcoming|future).*(event|townhall)|event.*(next|upcoming|future)/.test(normalizedQuestion)) return null;
  const today = new Date().toISOString().slice(0, 10);
  const events = knowledge
    .filter((doc) => doc.tab === "Events" && doc.raw.date)
    .filter((doc) => doc.raw.status === "Upcoming" || String(doc.raw.date) >= today)
    .sort((left, right) => String(left.raw.date).localeCompare(String(right.raw.date)));
  if (!events.length) return "No upcoming events were found.";
  const event = events[0];
  return `${event.raw.eventName} is scheduled for ${event.raw.date}${event.raw.location ? ` in ${event.raw.location}` : ""}.`;
}

function buildKnowledgeBaseFromObject(knowledge) {
  if (!knowledge || typeof knowledge !== "object") return [];

  const docs = [];
  for (const [tabKey, items] of Object.entries(knowledge)) {
    const label = TAB_LABELS[tabKey] || tabKey;
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const title = item.name || item.eventName || item.projectName || item.title || item.designation || item.deliveryTitle || item.capability || item.enterpriseId || "Record";
      const text = [
        `Tab: ${label}`,
        `Title: ${title}`,
        ...Object.entries(item)
          .filter(([field]) => !SENSITIVE_FIELDS.has(field.toLowerCase()))
          .map(([field, value]) => `${humanizeField(field)}: ${flatValue(value)}`),
      ].join(" ");

      docs.push({ tab: label, title, text, raw: item });
    }
  }

  return docs;
}

function scoreDocument(doc, questionTokens) {
  const q = normalize(questionTokens.join(" "));
  const text = normalize(doc.text);
  let score = 0;

  for (const token of questionTokens) {
    if (!token) continue;
    if (containsTerm(text, token)) score += 6;
    if (containsTerm(doc.title, token)) score += 10;
    if (containsTerm(doc.tab, token)) score += 8;
  }

  if (q.includes(normalize(doc.tab))) score += 20;
  if (q.includes(normalize(doc.title))) score += 20;

  return score;
}

function getEntityTokens(doc) {
  return normalize(`${doc.raw?.name || ""} ${doc.raw?.enterpriseId || ""}`)
    .split(" ")
    .filter((token) => token.length > 1);
}

function findEntityMatches(question, knowledgeDocs) {
  const questionTokens = normalize(question).split(" ").filter((token) => token.length > 2);
  return knowledgeDocs
    .map((doc) => {
      const entityTokens = getEntityTokens(doc);
      const matchedTokens = entityTokens.filter((entityToken) => questionTokens.some((questionToken) => questionToken === entityToken));
      return { doc, score: matchedTokens.length / Math.max(entityTokens.length, 1), matchedTokens: matchedTokens.length };
    })
    .filter((entry) => entry.matchedTokens > 0)
    .sort((left, right) => right.score - left.score || right.matchedTokens - left.matchedTokens);
}

function extractName(question) {
  const cleaned = normalize(question);
  const match = cleaned.match(/(?:who is|what is|tell me about|show me|details of)\s+([a-z0-9 .'-]+)/i);
  if (!match) return null;
  return match[1].trim();
}

function editDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

function tokenSimilarity(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const longestLength = Math.max(left.length, right.length);
  return 1 - editDistance(left, right) / longestLength;
}

function findBestNameMatch(nameQuery, knowledgeDocs) {
  const queryTokens = normalize(nameQuery).split(" ").filter((token) => token.length > 1);
  if (queryTokens.length < 2) return null;

  const candidates = knowledgeDocs
    .filter((doc) => doc.raw && (doc.raw.name || doc.raw.enterpriseId))
    .map((doc) => {
      const candidateTokens = normalize(`${doc.raw.name || ""} ${doc.raw.enterpriseId || ""}`)
        .split(" ")
        .filter((token) => token.length > 1);
      const score = queryTokens.reduce((total, queryToken) => {
        const bestTokenScore = Math.max(...candidateTokens.map((candidateToken) => tokenSimilarity(queryToken, candidateToken)));
        return total + bestTokenScore;
      }, 0) / queryTokens.length;
      return { doc, score };
    })
    .sort((left, right) => right.score - left.score);

  const best = candidates[0];
  const secondBest = candidates[1];
  if (!best || best.score < 0.78 || (secondBest && best.score - secondBest.score < 0.08)) return null;
  return best.doc;
}

function isGreetingQuestion(question) {
  const cleaned = normalize(String(question || ""));
  if (!cleaned) return false;
  return ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "greetings", "yo"].some((greeting) => cleaned === greeting || cleaned.startsWith(greeting));
}

function retrieveDocuments(question, knowledge = buildKnowledgeBase()) {
  const trimmed = String(question || "").trim();
  if (!trimmed) return [];

  const knowledgeDocs = Array.isArray(knowledge) && knowledge.length && typeof knowledge[0] === "object" && knowledge[0].text
    ? knowledge
    : buildKnowledgeBaseFromObject(knowledge);

  const q = normalize(trimmed);
  const questionTokens = q
    .split(" ")
    .filter((token) => token.length > 2)
    .filter((token) => !["what", "when", "where", "who", "which", "tell", "about", "show", "me", "the", "this", "that", "from", "for", "with"].includes(token));

  const scored = knowledgeDocs
    .map((doc) => ({ doc, score: scoreDocument(doc, questionTokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored;
}

async function retrieveDocumentsHybrid(question, knowledge = buildKnowledgeBase()) {
  const trimmed = String(question || "").trim();
  if (!trimmed) return [];

  const knowledgeDocs = Array.isArray(knowledge) && knowledge.length && typeof knowledge[0] === "object" && knowledge[0].text
    ? knowledge
    : buildKnowledgeBaseFromObject(knowledge);
  const q = normalize(trimmed);
  const questionTokens = q
    .split(" ")
    .filter((token) => token.length > 2)
    .filter((token) => !["what", "when", "where", "who", "which", "tell", "about", "show", "me", "the", "this", "that", "from", "for", "with"].includes(token));
  const lexicalScores = knowledgeDocs.map((doc) => scoreDocument(doc, questionTokens));
  const maxLexicalScore = Math.max(...lexicalScores, 1);

  const semanticMatches = await searchVectorIndex(knowledgeDocs, trimmed, 5);
  if (!semanticMatches) return retrieveDocuments(trimmed, knowledgeDocs);

  const lexicalByText = new Map(knowledgeDocs.map((doc, index) => [doc.text, lexicalScores[index] / maxLexicalScore]));
  const lexicalMatches = knowledgeDocs
    .map((doc, index) => ({ doc, score: lexicalScores[index] / maxLexicalScore }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
  const candidates = new Map(lexicalMatches.map((entry) => [entry.doc.text, { doc: entry.doc, lexicalScore: entry.score, semanticScore: 0 }]));
  findEntityMatches(trimmed, knowledgeDocs).slice(0, 2).forEach(({ doc }) => {
    const existing = candidates.get(doc.text) || { doc, lexicalScore: lexicalByText.get(doc.text) || 0, semanticScore: 0 };
    candidates.set(doc.text, existing);
  });
  semanticMatches.forEach(({ doc, score }) => {
    const existing = candidates.get(doc.text) || { doc, lexicalScore: lexicalByText.get(doc.text) || 0, semanticScore: 0 };
    existing.semanticScore = score;
    candidates.set(doc.text, existing);
  });

  return [...candidates.values()]
    .map(({ doc, lexicalScore, semanticScore }) => ({ doc, score: lexicalScore * 0.45 + semanticScore * 0.55 }))
    .sort((left, right) => right.score - left.score);
}

function answerNamedQuestion(question, knowledge = buildKnowledgeBase()) {
  const directName = extractName(question);
  if (!directName) return null;

  const knowledgeDocs = Array.isArray(knowledge) && knowledge.length && typeof knowledge[0] === "object" && knowledge[0].text
    ? knowledge
    : buildKnowledgeBaseFromObject(knowledge);
  const normalizedName = normalize(directName);
  const nameMatch = knowledgeDocs.find((doc) => {
    const recordName = normalize(doc.raw?.name || "");
    const enterpriseId = normalize(doc.raw?.enterpriseId || "");
    return recordName.includes(normalizedName) || enterpriseId.includes(normalizedName);
  }) || findBestNameMatch(directName, knowledgeDocs);

  if (!nameMatch?.raw) return null;

  const raw = nameMatch.raw;
  const name = raw.name || raw.eventName || raw.projectName || raw.title || nameMatch.title;
  const details = [];
  if (raw.role) details.push(`role: ${raw.role}`);
  if (raw.designation) details.push(`designation: ${raw.designation}`);
  if (raw.location) details.push(`location: ${raw.location}`);
  if (raw.projectName) details.push(`project: ${raw.projectName}`);
  if (raw.description) details.push(`summary: ${raw.description}`);
  const summary = details.length ? details.join("; ") : "This record exists in the application data.";
  return `${name} appears in the ${nameMatch.tab} data. ${summary}.`;
}

function answerEntityFieldQuestion(question, knowledge = buildKnowledgeBase()) {
  const knowledgeDocs = Array.isArray(knowledge) && knowledge.length && typeof knowledge[0] === "object" && knowledge[0].text
    ? knowledge
    : buildKnowledgeBaseFromObject(knowledge);
  const entity = findEntityMatches(question, knowledgeDocs)[0]?.doc;
  if (!entity?.raw) return null;

  const questionTokens = new Set(normalize(question).split(" ").filter((token) => token.length > 2));
  const field = Object.keys(entity.raw)
    .filter((key) => !SENSITIVE_FIELDS.has(key.toLowerCase()) && key !== "id")
    .map((key) => ({ key, label: humanizeField(key), tokens: humanizeField(key).split(" ") }))
    .filter(({ tokens }) => tokens.length && tokens.every((token) => questionTokens.has(token)))
    .sort((left, right) => right.tokens.length - left.tokens.length)[0];
  if (!field) return null;

  const value = entity.raw[field.key];
  const name = entity.raw.name || entity.raw.enterpriseId || entity.title;
  if (value === undefined || value === null || value === "") return `${name} has no ${field.label} recorded in the application data.`;
  return `${name}'s ${field.label} is ${flatValue(value)}.`;
}

function answerStructuredQuestion(question, knowledge = buildKnowledgeBase()) {
  const trimmed = String(question || "").trim();
  if (!trimmed) return "Please ask a question about the data visible in the dashboard, teams, leadership, events, deliverables, or program tabs.";
  if (isGreetingQuestion(trimmed)) return "Hi! Ask me about the people, teams, leadership, events, capabilities, deliverables, or program data shown in this app.";

  const knowledgeDocs = Array.isArray(knowledge) && knowledge.length && typeof knowledge[0] === "object" && knowledge[0].text
    ? knowledge
    : buildKnowledgeBaseFromObject(knowledge);
  return answerDashboardQuestion(trimmed)
    || answerUsersByStatus(trimmed, knowledgeDocs)
    || answerUsersByLocation(trimmed, knowledgeDocs)
    || answerUsersByProject(trimmed, knowledgeDocs)
    || answerLeadershipList(trimmed, knowledgeDocs)
    || answerEventsByStatus(trimmed, knowledgeDocs)
    || answerRecognitionQuestion(trimmed, knowledgeDocs)
    || answerDomainListQuestion(trimmed)
    || answerRetailBankingSupportQuestion(trimmed)
    || answerCapabilityQuestion(trimmed, knowledgeDocs)
    || answerProgramsByFranchise(trimmed, knowledgeDocs)
    || answerDeliverableFilter(trimmed, knowledgeDocs)
    || answerNextEvent(trimmed, knowledgeDocs)
    || answerPricingMetricQuestion(trimmed)
    || answerPricingQuestion(trimmed)
    || answerUsersByLocation(trimmed, knowledgeDocs)
    || answerEntityFieldQuestion(trimmed, knowledgeDocs)
    || answerNamedQuestion(trimmed, knowledgeDocs);
}

function answerQuestion(question, knowledge = buildKnowledgeBase()) {
  const trimmed = String(question || "").trim();
  const structuredAnswer = answerStructuredQuestion(trimmed, knowledge);
  if (structuredAnswer) return structuredAnswer;

  const knowledgeDocs = Array.isArray(knowledge) && knowledge.length && typeof knowledge[0] === "object" && knowledge[0].text
    ? knowledge
    : buildKnowledgeBaseFromObject(knowledge);

  const scored = retrieveDocuments(trimmed, knowledgeDocs);

  if (!scored.length) {
    return "I could not find a direct match in the current records. Try asking about a person, team, leadership member, event, deliverable, or capability shown on the site.";
  }

  const top = scored[0].doc;
  return `I found related records in the ${top.tab} section, but I could not determine a reliable direct answer. Please specify the person, field, filter, or metric you need.`;
}

module.exports = {
  buildKnowledgeBase,
  retrieveDocuments,
  retrieveDocumentsHybrid,
  answerNamedQuestion,
  answerEntityFieldQuestion,
  answerStructuredQuestion,
  answerQuestion,
  answerUsersByLocation,
};
