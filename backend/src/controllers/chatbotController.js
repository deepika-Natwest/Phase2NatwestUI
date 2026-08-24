const { answerQuestion, answerStructuredQuestion, buildKnowledgeBase, retrieveDocumentsHybrid } = require("../services/ragService");
const { answerWithLlm, getProvider } = require("../services/llmService");

exports.askQuestion = async (req, res) => {
  const { question } = req.body;

  if (!question || !String(question).trim()) {
    return res.status(400).json({ message: "Question is required." });
  }

  try {
    const knowledge = buildKnowledgeBase();
    const structuredAnswer = answerStructuredQuestion(question, knowledge);
    if (structuredAnswer) {
      return res.json({ answer: structuredAnswer, provider: "local-retrieval" });
    }

    const documents = await retrieveDocumentsHybrid(question, knowledge);

    if (getProvider() && documents.length) {
      try {
        const answer = await answerWithLlm(question, documents);
        return res.json({ answer, provider: getProvider() });
      } catch (error) {
        console.error("LLM request failed; using local grounded fallback.", error.message);
      }
    }

    return res.json({ answer: answerQuestion(question, knowledge), provider: "local-retrieval" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to answer the question from app data." });
  }
};