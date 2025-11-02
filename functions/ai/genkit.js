/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */

const functions = require("firebase-functions");

// Try to import plugin factory safely
let googleAI;
try {
  const g = require("@genkit-ai/google-genai");
  googleAI = g.googleAI || g.default || g;
} catch (err) {
  googleAI = null;
}

// Safely read functions.config()
const cfg = functions.config();
const apiKey =
  process.env.GENKIT_KEY || (cfg && cfg.genkit && cfg.genkit.key) || "";

// Build plugin list only if plugin exists
const plugins = [];
if (googleAI) plugins.push(googleAI({apiKey}));

let aiClient = null;
let initError = null;

/**
 * Attempts to initialize Genkit using all known package patterns.
 */
function tryInit() {
  // Pattern 1: @genkit-ai/core (official)
  try {
    const core = require("@genkit-ai/core");
    if (core && typeof core.Genkit === "function") {
      aiClient = new core.Genkit({plugins, logLevel: "info"});
      return;
    }
    if (typeof core === "function") {
      aiClient = core({plugins, logLevel: "info"});
      return;
    }
    if (core && typeof core.default === "function") {
      aiClient = core.default({plugins, logLevel: "info"});
      return;
    }
  } catch (e) {
    initError = e;
  }

  // Pattern 2: legacy "genkit" package
  try {
    const genkit = require("genkit");
    if (genkit) {
      if (typeof genkit.configureGenkit === "function") {
        aiClient = genkit.configureGenkit({plugins, logLevel: "info"});
        return;
      }
      if (typeof genkit.configure === "function") {
        aiClient = genkit.configure({plugins, logLevel: "info"});
        return;
      }
      if (typeof genkit === "function") {
        aiClient = genkit({plugins, logLevel: "info"});
        return;
      }
    }
  } catch (e) {
    initError = initError || e;
  }

  // All attempts failed — leave aiClient null for fallback error below
}

// Run initializer
tryInit();

// If still no client, throw guidance error
if (!aiClient) {
  const advice = [
    "Genkit SDK initialization failed. No compatible export shape found.",
    "Install or align packages as follows:",
    "  npm --prefix functions install @genkit-ai/core @genkit-ai/google-genai",
    "Or for legacy:",
    "  npm --prefix functions uninstall genkit && npm --prefix functions install genkit @genkit-ai/google-genai",
    "",
    "Inspect versions:",
    "  cd functions && npm ls genkit @genkit-ai/core @genkit-ai/google-genai --depth=0",
    "",
    "Init error (first caught):",
    initError ? String(initError) : "none",
  ].join("\n");

  throw new Error(advice);
}

/**
 * Generates an AI response using the initialized Genkit client.
 * @param {string} prompt - User prompt text.
 * @return {Promise<string>} AI-generated response text.
 */
async function generateResponse(prompt) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("prompt must be a non-empty string");
  }

  try {
    if (typeof aiClient.generate === "function") {
      const out = await aiClient.generate({
        model: process.env.GENKIT_MODEL || "googleai/gemini-1.5-flash-latest",
        prompt,
      });

      if (!out) return "No response from AI.";
      if (typeof out === "string") return out;
      if (typeof out.text === "function") return out.text();
      if (typeof out.text === "string") return out.text;
      if (typeof out.outputText === "string") return out.outputText;
      if (Array.isArray(out) && out[0] && out[0].text) return out[0].text;
      return JSON.stringify(out).slice(0, 2000);
    }

    if (typeof aiClient.call === "function") {
      const out = await aiClient.call(prompt);
      return (out && out.text) || String(out);
    }

    if (typeof aiClient.run === "function") {
      const out = await aiClient.run({prompt});
      return (out && out.text) || String(out);
    }

    throw new Error("No supported generate API found on aiClient.");
  } catch (err) {
    console.error("generateResponse error:", err);
    throw err;
  }
}

module.exports = {generateResponse};
