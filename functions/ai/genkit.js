
/* eslint-disable */
const functions = require("firebase-functions");
const wav = require("wav");

async function initGenkit() {
  try {
    const { genkit } = await import("@genkit-ai/core");
    const { googleAI } = await import("@genkit-ai/google-genai");

    const apiKey =
      process.env.GENKIT_KEY ||
      (functions.config().genkit && functions.config().genkit.key) ||
      "";

    // Use the modern genkit() function for initialization
    const ai = genkit({
      plugins: [googleAI({ apiKey })],
      logLevel: "info",
    });

    return ai;
  } catch (err) {
    console.error("Genkit init error:", err);
    throw new Error(
      "🔥 Genkit failed to initialize. Verify @genkit-ai/core & @genkit-ai/google-genai are installed and versions match."
    );
  }
}

let aiInstance = null;
async function getAI() {
  if (!aiInstance) aiInstance = await initGenkit();
  return aiInstance;
}

async function generateResponse(prompt) {
  if (!prompt) throw new Error("Prompt required");
  const ai = await getAI();
  const result = await ai.generate({
    model: "googleai/gemini-1.5-flash-latest",
    prompt,
  });
  // Use .text instead of .text() for Genkit v1
  return result.text;
}

// Helper to convert PCM audio to WAV format
async function toWav(pcmData, channels = 1, rate = 24000, sampleWidth = 2) {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        const bufs = [];
        writer.on('error', reject);
        writer.on('data', (d) => bufs.push(d));
        writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

        writer.write(pcmData);
        writer.end();
    });
}

// New function to generate a text review and its corresponding audio
async function generateReviewWithAudio(prompt) {
  if (!prompt) throw new Error("Prompt required");
  const ai = await getAI();

  // 1. Generate the text review
  const textResult = await ai.generate({
    model: "googleai/gemini-1.5-flash-latest",
    prompt,
  });
  const reviewText = textResult.text;

  if (!reviewText) {
    throw new Error("Failed to generate a text review.");
  }

  // 2. Generate the audio from the text
  const { media } = await ai.generate({
    model: "googleai/gemini-2.5-flash-preview-tts",
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Algenib' },
        },
      },
    },
    prompt: reviewText,
  });

  if (!media?.url) {
    throw new Error("No audio was generated from the text.");
  }

  // 3. Convert PCM to WAV and return both text and audio
  const audioBuffer = Buffer.from(
    media.url.substring(media.url.indexOf(',') + 1),
    'base64'
  );
  const wavBase64 = await toWav(audioBuffer);
  const audioDataUri = `data:audio/wav;base64,${wavBase64}`;

  return {
    review: reviewText,
    reviewAudio: audioDataUri,
  };
}


module.exports = { generateResponse, generateReviewWithAudio };
