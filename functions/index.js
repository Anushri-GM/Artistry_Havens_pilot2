/**
 * ✅ Artistry Havens Firebase Backend
 * Handles: User creation, message processing with Genkit AI,
 * and HTTPS callable endpoints.
 */

const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {
  onCall,
  onRequest,
  HttpsError,
} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2/options");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");

// 🔹 Import AI module
const {generateResponse} = require("./ai/genkit.js");

// 🌍 Set global region for all functions
setGlobalOptions({region: "asia-south2"});

// 🏗 Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: "artistry-havens-1-654483-678d5",
});

// 🔹 Firestore reference
const db = admin.firestore();
logger.info("✅ Connected to Firestore database: (default)");

/**
 * 🌐 Health Check Endpoint
 * Confirms backend + region + Firestore connection.
 */
exports.testBackend = onRequest((req, res) => {
  logger.info("testBackend function called!");
  res.status(200).json({
    message: "Firebase backend is running successfully!",
    database: "(default)",
    region: "asia-south2",
  });
});

/**
 * 👤 Trigger: When a new user document is created in Firestore.
 * Path: users/{userId}
 */
exports.onUserCreate = onDocumentCreated("users/{userId}", async (event) => {
  const snap = event.data;
  if (!snap) {
    logger.error("No data in onUserCreate event.");
    return null;
  }

  const userData = snap.data();
  const userId = event.params.userId;

  logger.info(`🧑‍💻 New user created: ${userId}`, userData);

  // Basic validation
  if (!userData.email || !userData.name || !userData.role) {
    logger.warn(`User ${userId} missing email, name, or role.`);
  }

  // Add createdAt if not set
  if (!userData.createdAt) {
    await snap.ref.set(
        {createdAt: admin.firestore.FieldValue.serverTimestamp()},
        {merge: true},
    );
  }

  return null;
});

/**
 * 💬 Trigger: When a new message document is created.
 * Path: messages/{messageId}
 */
exports.onMessageCreate = onDocumentCreated(
    "messages/{messageId}",
    async (event) => {
      const snap = event.data;
      if (!snap) {
        logger.warn("No data in onMessageCreate event.");
        return null;
      }

      const messageData = snap.data();
      const messageId = event.params.messageId;

      if (!messageData || !messageData.text) {
        logger.info(`Message ${messageId} missing text; skipping.`);
        return null;
      }

      try {
        const aiResponseText = await generateResponse(messageData.text);

        await db.collection("aiRequests").add({
          userId: messageData.senderId || "unknown",
          prompt: messageData.text,
          response: aiResponseText,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(
            `🤖 AI response stored for message: ${messageId}`,
        );
      } catch (error) {
        logger.error("❌ Genkit AI processing failed:", error);
      }

      return null;
    },
);

/**
 * ⚙️ HTTPS Callable: Generate AI response from frontend.
 * Requires auth.
 */
exports.generateAIResponse = onCall(async (request) => {
  const context = request.auth;
  const data = request.data;

  if (!context || !context.uid) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const {prompt} = data;
  const userId = context.uid;

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    throw new HttpsError(
        "invalid-argument",
        "'prompt' must be a non-empty string.",
    );
  }

  try {
    const aiResponseText = await generateResponse(prompt);

    await db.collection("aiRequests").add({
      userId,
      prompt,
      response: aiResponseText,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(
        `✅ AI response generated for user: ${userId}`,
    );

    return {response: aiResponseText};
  } catch (error) {
    logger.error("❌ generateAIResponse failed:", error);
    throw new HttpsError("internal", "Failed to generate AI response.");
  }
});
