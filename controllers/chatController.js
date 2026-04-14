const OpenAI = require("openai");

exports.chat = async (req, res, next) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const model = req.body?.model || "gpt-4o-mini";

    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ success: false, message: "OPENAI_API_KEY is not configured" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const normalized = messages
      .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .map((m) => ({ role: m.role, content: m.content }));

    const system = {
      role: "system",
      content:
        "You are NutriAI, a friendly food and nutrition assistant. Keep responses concise (2-3 sentences). Be practical and helpful.",
    };

    const completion = await client.chat.completions.create({
      model,
      messages: [system, ...normalized],
      temperature: 0.7,
      max_tokens: 300,
    });

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "I can help with meals and nutrition. What are your preferences or ingredients?";

    res.json({ success: true, reply });
  } catch (err) {
    // Do not crash the app if OpenAI fails
    console.error("chat error", err?.message || err);
    res.json({
      success: true,
      reply:
        "I’m having trouble reaching the AI service right now. Tell me your ingredients and goal, and I’ll suggest a simple meal.",
    });
  }
};

