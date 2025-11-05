# Artistry Havens - Empowering Artisans with AI

Artistry Havens is a modern, mobile-first marketplace designed to connect artisans with a global audience of buyers and sponsors. By integrating powerful AI tools, the platform removes the technical barriers to e-commerce, allowing creators to focus on what they do best: creating.

## What is Artistry Havens?

This application provides a seamless, multilingual platform for three distinct user roles:

*   **Artisans:** Can showcase their creations, manage a digital storefront, track sales, and connect with sponsors, all with the help of an AI assistant.
*   **Buyers:** Can discover unique handmade goods, browse by category, and even use AI to design custom products and commission them from artisans.
*   **Sponsors:** Can discover and support talented artisans, fostering the creative community and sharing in their success.

---

## Key Features

The platform is packed with features designed to create an intuitive and powerful experience for every user.

### For Artisans:
*   **AI-Powered Product Creation:** Simply upload a photo of your craft, and our AI will automatically generate a compelling product name, marketing description, category, and even a unique backstory.
*   **AI Image Enhancement:** With a single click, improve the lighting, sharpness, and color balance of your product photos to make them look professional.
*   **Multilingual Voice Navigation:** Navigate your dashboard, manage orders, and check statistics by speaking commands in your native language.
*   **Business Dashboard:** Track your revenue, sales, and product likes over time with simple, visual charts and get AI-powered insights on your performance.
*   **Order & Sponsor Management:** A clear interface to manage incoming orders and review sponsorship requests.

### For Buyers:
*   **AI-Powered Custom Design:** Have a unique idea? Describe it with text or upload a reference image, and our AI will generate a visual concept of your custom product.
*   **Direct-to-Artisan Requests:** Send your AI-generated designs directly to an artisan to start a conversation about bringing your idea to life.
*   **Curated Discovery:** Browse trending products, best-sellers, and shop by category to find the perfect handmade item.

### For Sponsors:
*   **Discover & Support:** Find talented artisans by browsing their work and offer them financial support.
*   **Track Your Impact:** A dedicated dashboard shows the revenue generated from your sponsorships, allowing you to see the direct impact of your contributions.

---

## Technical Architecture

Artistry Havens is built on a modern, serverless stack designed for scalability and performance.

*   **Frontend:** **Next.js 15** (App Router) with **React** and **TypeScript**.
*   **UI:** **ShadCN UI** component library, styled with **Tailwind CSS**.
*   **Backend:** **Firebase Functions** for serverless logic and the **Next.js** server environment.
*   **Database:** **Cloud Firestore** (NoSQL) for all application data.
*   **Authentication:** **Firebase Authentication** for secure phone & OTP sign-in.
*   **AI Integration:** **Genkit** is used to orchestrate calls to **Google AI Platform** models:
    *   **Gemini 2.5 Flash:** Powers product description generation, voice navigation, and performance insights.
    *   **Imagen 4:** Generates new product images from text descriptions.
    *   **Gemini 2.5 Flash Image:** Enhances product photos and creates new visuals from reference images.
    *   **TTS (Text-to-Speech):** Provides audio playback for AI-generated reviews.
*   **Hosting:** The application is hosted on **Firebase App Hosting**.

---

## Running Locally

To run the Artistry Havens application on your local machine, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Up Local Environment Variables:**
    Create a file named `.env.local` in the root of the project and add your Google AI (Gemini) API key:
    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
    This file is for local development only and will not be uploaded to your hosting provider.

3.  **Enable Firebase Phone Sign-In:**
    Go to your **Firebase Console**, navigate to **Authentication -> Sign-in method**, and ensure the **Phone** provider is enabled for your project.

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

## Deploying to Production (Vercel)

When deploying your application to a hosting provider like Vercel, you must provide your `GEMINI_API_KEY` in the project settings for the AI features to work.

1.  **Go to your Vercel project dashboard.**
2.  Navigate to the **Settings** tab.
3.  Click on **Environment Variables** in the side menu.
4.  Add a new variable:
    *   **Name:** `GEMINI_API_KEY`
    *   **Value:** Paste your actual Gemini API key.
5.  Ensure the variable is available for the **Production** environment.
6.  **Redeploy** your application to apply the changes.
