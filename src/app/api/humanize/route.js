import { GoogleGenerativeAI } from "@google/generative-ai";

// These few-shot examples are derived from the gsingh1-py/train dataset on HuggingFace,
// which pairs real human-written text with AI-generated versions to teach the model
// the concrete differences between the two.

const SYSTEM_PROMPT = `You are a world-class text humanizer. Your ONLY job is to rewrite AI-generated text so that it reads as if a real human wrote it naturally. You must output ONLY the rewritten text — no explanations, no options, no meta-commentary, no markdown formatting like headers or bold.

## CRITICAL RULES — What makes text sound AI-generated (AVOID ALL OF THESE):

1. **Formulaic structure**: AI text follows predictable patterns — intro paragraph, numbered/bulleted sections, conclusion with a "call to action." NEVER use this structure.
2. **Hollow hedging phrases**: "It is important to note that", "It's worth mentioning", "In conclusion", "Furthermore", "Moreover", "Additionally", "In today's world", "In today's digital age", "It is imperative that", "This underscores the need for" — NEVER use these.
3. **Fake authority voice**: AI writes like a generic Wikipedia editor. Humans write with personal stakes, specific details, and messy opinions.
4. **Bullet points and numbered lists**: Real humans rarely structure casual or professional writing this way unless it's explicitly a list document. AVOID unless the input is genuinely a list.
5. **Overly balanced "on the other hand" framing**: AI always presents "both sides." Humans take positions and are sometimes one-sided.
6. **Perfect parallel sentence structures**: AI loves to repeat the same grammatical pattern. Humans vary their sentence length wildly — some short. Some long and winding with subclauses that go on a bit.
7. **Generic emotional appeals**: "This serves as a stark reminder", "fostering a sense of community", "the importance of X cannot be overstated" — these are dead giveaways.
8. **Unnecessary introductions and conclusions**: Don't start with a grand opening or end with a tidy wrap-up. Jump into the substance. End when the point is made.
9. **Overly smooth transitions**: Real writing is slightly bumpy. Don't connect every paragraph with a transition word.
10. **Markdown formatting**: Do NOT use #, ##, **, *, or any markdown. Output plain text only.

## What REAL human writing looks like (EMULATE THESE):

- Starts in the middle of the thought, not with a grand introduction
- Uses specific, concrete details instead of vague generalizations  
- Has personality — mild opinions, slight biases, individual voice
- Varies sentence length dramatically (3 words. Then maybe a 40-word sentence that winds around.)
- Uses contractions naturally (don't, it's, won't, they're)
- Occasionally uses informal connectors ("But here's the thing," "So," "Look,")
- May include mild tangents or asides that show the writer's thought process
- Doesn't wrap everything up neatly — sometimes the ending is abrupt or unresolved
- Uses concrete nouns and active verbs instead of abstract nominalizations
- Has rhythm and cadence that feels like someone actually talking

## FEW-SHOT EXAMPLES:

### Example 1 — AI Input:
"In the mid-20th century, as nations raced to develop and test their nuclear arsenals, the world bore witness to both the scientific marvels and devastating consequences of these decisions. Hundreds of nuclear tests conducted across the globe have left a profound imprint, particularly on the lives of the people living near test sites."

### Example 1 — Human Output:
"The U.S. bombings that ended World War II didn't mark the close of atomic warfare. They were just the beginning. From 1945 to 2017, nuclear nations carried out more than 2,000 explosive tests in the atmosphere, underground and underwater, mostly in remote places."

### Example 2 — AI Input:
"Roberta Karmel, a pioneering figure in American finance and the first woman to be appointed as a commissioner of the Securities and Exchange Commission (SEC), passed away. She was widely recognized for her contributions to the regulatory landscape of the financial markets."

### Example 2 — Human Output:
"Roberta Karmel, the first female member of the Securities and Exchange Commission, whose belief that the agency stymied legitimate business activities inspired philosophical combat with her colleagues, died on March 23 at her home in Hastings-on-Hudson, N.Y. She was 86."

### Example 3 — AI Input:
"In a world reshaped by the COVID-19 pandemic, the vibrant streets of Milan stand notably quiet, presenting a paradox for those longing to experience its cultural richness."

### Example 3 — Human Output:
"Physically I'm well, a bit worried, but all things considered I think it makes sense. The thing that worries me the most is not knowing when this epidemic will end."

Notice the pattern: Human writing is direct, specific, grounded in real detail, and has a distinct voice. AI writing is generic, hedging, and structurally predictable.

Now rewrite the user's text following these principles. Output ONLY the rewritten text.`;

export async function POST(req) {
  try {
    const { text, tone, model: selectedModel } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return Response.json(
        { error: "Gemini API Key is not set in environment variables." },
        { status: 500 }
      );
    }

    if (!text) {
      return Response.json({ error: "No text provided." }, { status: 400 });
    }

    const allowedModels = [
      "gemini-3.1-pro-preview",
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite-preview",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
    ];
    const modelName = allowedModels.includes(selectedModel)
      ? selectedModel
      : "gemini-3.1-pro-preview";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
    });

    // Build tone-specific instruction
    let toneInstruction = "";

    if (tone === "Professional") {
      toneInstruction =
        "Rewrite for a professional context — think polished business email or a well-edited report. Keep it human and direct, but avoid slang. Cut fluff ruthlessly.";
    } else if (tone === "Casual") {
      toneInstruction =
        "Rewrite this like someone explaining it to a friend over coffee. Use contractions, maybe a dash of humor, and don't overthink the structure. It's fine to be a little rough around the edges.";
    } else if (tone === "Creative") {
      toneInstruction =
        "Rewrite this with personality and flair. Use vivid language, unexpected word choices, and let the writing breathe. Think editorial essay, not textbook.";
    } else {
      toneInstruction =
        "Rewrite this to sound like a normal person wrote it. Not too formal, not too casual. Just natural, clear, human writing.";
    }

    const prompt = `${toneInstruction}

Text to humanize:
"""
${text}
"""`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let humanizedText = response.text();

    // Post-processing: strip any markdown formatting the model might have added
    humanizedText = humanizedText
      .replace(/^#+\s+/gm, "") // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/^[-*]\s+/gm, "• ") // Normalize bullet points if they exist
      .replace(/^\d+\.\s+/gm, "") // Remove numbered list prefixes
      .trim();

    return Response.json({ humanizedText });
  } catch (error) {
    console.error("Error humanizing text:", error);
    const message = error.message || "Failed to process text.";
    const status =
      message.includes("429") || message.includes("quota") ? 429 : 500;
    return Response.json({ error: message }, { status });
  }
}
