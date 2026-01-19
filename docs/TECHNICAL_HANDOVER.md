# Technical Handover Document: Artistry Havens

**Version:** 1.0
**Date:** 2024-10-27

## Introduction

This document provides a detailed technical overview of the Artistry Havens application for a seamless handover to a senior development team. It covers the core architectural components, data structures, and key logic required to understand, maintain, and extend the platform.

---

## 1. Data Model (Firestore Schemas)

The application uses Cloud Firestore as its primary database. The data is structured into several top-level collections. The following JSON Schemas define the structure of each primary data entity.

### User Schema (`/users/{userId}`)
Represents an artisan, buyer, or sponsor. The document ID matches the Firebase Auth UID.
```json
{
  "title": "User",
  "type": "object",
  "description": "Represents a user of the application...",
  "properties": {
    "name": { "type": "string", "description": "User's display name." },
    "userType": { "type": "string", "description": "The type of user (artisan, buyer, or sponsor)." },
    "createdAt": { "type": "string", "format": "date-time" },
    "avatarUrl": { "type": "string", "description": "URL of the user's profile picture." },
    "location": { "type": "string", "description": "User's primary shipping address." },
    "phone": { "type": "string", "description": "User's contact information." },
    "categories": {
      "type": "array",
      "items": { "type": "string" },
      "description": "For artisans, lists the craft categories they specialize in."
    }
  },
  "required": ["name", "userType", "createdAt"]
}
```

### Product Schema (`/products/{productId}`)
Represents a product listed by an artisan.
```json
{
  "title": "Product",
  "type": "object",
  "description": "Represents a product listed by an artisan for sale.",
  "properties": {
    "name": { "type": "string" },
    "price": { "type": "number" },
    "description": { "type": "string" },
    "story": { "type": "string" },
    "mainImageUrl": { "type": "string" },
    "createdAt": { "type": "string", "format": "date-time" },
    "artisan": { "$ref": "#/entities/User" },
    "category": { "type": "string" },
    "availableQuantity": { "type": "integer" }
  },
  "required": ["name", "price", "description", "mainImageUrl", "createdAt"]
}
```

### Order Schema (`/orders/{orderId}`)
Represents a purchase order made by a buyer.
```json
{
  "title": "Order",
  "type": "object",
  "properties": {
    "orderDate": { "type": "string", "format": "date-time" },
    "totalAmount": { "type": "number" },
    "status": { "type": "string", "enum": ["Processing", "Shipped", "Delivered"] },
    "buyer": { "$ref": "#/entities/User" },
    "artisan": { "$ref": "#/entities/User" },
    "product": { "$ref": "#/entities/Product" },
    "shippingAddress": { "type": "string" },
    "quantity": { "type": "integer" },
    "productName": { "type": "string" },
    "productImageUrl": { "type": "string" },
    "buyerName": { "type": "string" }
  },
  "required": ["orderDate", "totalAmount", "status", "buyer", "artisan", "product", "quantity"]
}
```

### CustomizationRequest Schema (`/CustomizationRequest/{requestId}`)
Represents a request from a buyer for a custom-designed product.
```json
{
  "title": "CustomizationRequest",
  "type": "object",
  "properties": {
    "buyerId": { "type": "string" },
    "buyerName": { "type": "string" },
    "buyerShippingAddress": { "type": "string" },
    "generatedImageUrl": { "type": "string" },
    "description": { "type": "string" },
    "category": { "type": "string" },
    "status": { "type": "string", "enum": ["pending", "accepted", "rejected"] },
    "price": { "type": "number" }
  },
  "required": ["buyerId", "buyerName", "buyerShippingAddress", "generatedImageUrl", "description", "category", "price", "createdAt"]
}
```

### Notification Schema (`/users/{userId}/notifications/{notificationId}`)
Represents a notification sent to a user, stored in a subcollection.
```json
{
  "title": "Notification",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "message": { "type": "string" },
    "type": { "type": "string", "enum": ["customization_request", "new_order"] },
    "link": { "type": "string" },
    "createdAt": { "type": "string", "format": "date-time" },
    "requestId": { "type": "string" }
  },
  "required": ["title", "message", "type", "createdAt", "link"]
}
```

---

## 2. State Management: User Roles

User role handling is central to the application's architecture and determines the UI and functionality presented to the user.

-   **Authentication:** The app uses **Firebase Authentication** with the Phone/OTP provider. Upon successful sign-in, the user's `uid` is the primary identifier.
-   **Role Selection:** On first login or registration, the user selects their role (Artisan, Buyer, or Sponsor) on the `/role-selection` page.
-   **Firestore Document:** This role is stored in the user's corresponding Firestore document at `/users/{userId}` in the `userType` field.
-   **Role-Based Routing & Layouts:**
    -   The application uses Next.js route groups (`/artisan`, `/buyer`, `/sponsor`) to structure the different user experiences.
    -   Each route group has its own `layout.tsx` file (`/artisan/layout.tsx`, etc.), which provides the unique navigation (sidebar, bottom nav) and UI shell for that role.
    -   The `useUser` hook from `src/firebase/auth/use-user.tsx` provides the authentication state, and a subsequent Firestore query retrieves the `userType` to direct the user to the correct layout after login.

---

## 3. Core AI Logic (Genkit Flows)

The application leverages **Genkit** to orchestrate calls to Google's Generative AI models. The core logic is encapsulated in server-side "flows" located in `src/ai/flows/`.

### AI Story & Product Details Generation

This feature is used on the "Add Product" page to auto-populate form fields from a product image.

-   **File:** `src/ai/flows/generate-product-details.ts`
-   **Logic:**
    1.  The flow takes a product photo (as a Base64 data URI) and an optional target language as input.
    2.  It calls the `gemini-2.5-flash` model with a structured prompt, instructing it to analyze the image and return a JSON object containing a `productName`, `productCategory`, `productStory`, and `productDescription`.
    3.  The list of valid categories is dynamically injected into the prompt to ensure the model returns a valid category.
    4.  If a `targetLanguage` other than English is provided, the generated text fields are translated using a separate translation flow before being returned to the client.

```typescript
// src/ai/flows/generate-product-details.ts

const prompt = ai.definePrompt({
  name: 'generateProductDetailsPrompt',
  input: {schema: z.object({ photoDataUri: ... })},
  output: {schema: GenerateProductDetailsOutputSchema},
  prompt: `You are an expert product marketer for artisanal crafts. Analyze the provided image...

The product category must be one of the following: ${productCategories.join(', ')}.

Image: {{media url=photoDataUri}}`,
});
```

### Gemini AI Review for Product Ideas

This feature is on the "Trends" page for artisans, providing feedback on new product concepts.

-   **File:** `src/ai/flows/community-trend-insights.ts`
-   **Logic:**
    1.  The flow takes a `productDescription` (the artisan's idea) and an optional `language` as input.
    2.  If necessary, the description is first translated to English.
    3.  It calls the `gemini-2.5-flash` model with a prompt that sets the persona of an "expert AI business consultant."
    4.  The prompt instructs the model to provide a concise, single-paragraph review covering the product's potential, target audience, and a key suggestion for improvement.
    5.  The generated English review is then translated back to the artisan's original language.
    6.  Finally, the translated review text is passed to a Text-to-Speech flow (`text-to-speech.ts`) to generate a playable audio version.
    7.  Both the text and the audio data URI are returned to the client.

```typescript
// src/ai/flows/community-trend-insights.ts

const prompt = ai.definePrompt({
  name: 'communityTrendInsightsPrompt',
  input: {schema: z.object({ productDescription: z.string() })},
  output: {schema: z.object({ aiReview: z.string() })},
  prompt: `You are an expert AI business consultant for artisans...
  Your task is to provide a brief but comprehensive review covering the product's potential, target audience, and a key suggestion for improvement.
  Product Description: {{{productDescription}}}`,
});
```

---

## 4. Component Map

The UI is built with Next.js, React, and the **ShadCN UI** library. Below are the key custom components created for this project.

-   **`ProductCard`**:
    -   **Location:** `src/components/product-card.tsx`
    -   **Props:** `product: Product`, `onSave?: () => void`, `showSaveButton?: boolean`
    -   **Description:** A compact card for displaying a product's image, name, artisan, price, and like count. Used in grids and carousels.

-   **`ProductPreview`**:
    -   **Location:** `src/components/product-preview.tsx`
    -   **Props:** `product: Product`
    -   **Description:** A detailed, full-page view of a product, typically shown inside a `Dialog`. It displays the image, title, price, description, and story.

-   **`ArtisanSidebar` / `SponsorSidebar`**:
    -   **Location:** `src/components/artisan-sidebar.tsx`, `src/components/sponsor-sidebar.tsx`
    -   **Props:** `closeSheet?: () => void`
    -   **Description:** The primary slide-in navigation menus for the Artisan and Sponsor roles, respectively. They contain links to the main pages of their dashboards.

-   **`BuyerBottomNav`**:
    -   **Location:** `src/components/buyer-bottom-nav.tsx`
    -   **Props:** None.
    -   **Description:** The fixed bottom navigation bar for the Buyer role, providing quick access to Home, Customize, Orders, and Profile.

-   **`StatsChart`**:
    -   **Location:** `src/components/stats-chart.tsx`
    -   **Props:** `data: any[]`, `config: ChartConfig`, `dataKey: string`
    -   **Description:** A reusable bar chart component built with `Recharts` for visualizing artisan performance data (Likes vs. Sales).

-   **`FirebaseErrorListener`**:
    -   **Location:** `src/components/FirebaseErrorListener.tsx`
    -   **Props:** None.
    -   **Description:** An invisible client component that listens for globally emitted `permission-error` events from `src/firebase/error-emitter.ts`. It throws the received error to be caught by Next.js's error boundary, displaying a rich, informative error overlay during development.

---

## 5. Environment & Dependencies

### Firebase SDKs
-   **`firebase`**: The primary client-side SDK for interacting with Firebase services (v11.9.1).
    -   `firebase/app`
    -   `firebase/auth`
    -   `firebase/firestore`

### Generative AI
-   **`genkit`**: The core framework for orchestrating AI flows.
-   **`@genkit-ai/google-genai`**: Plugin for accessing Google AI models like Gemini.
-   **`@genkit-ai/vertexai`**: Plugin for accessing models via Vertex AI.
-   **`@genkit-ai/next`**: Next.js integration for Genkit.
-   **`zod`**: Used for defining and validating the input/output schemas for AI flows.

### Key Frontend Dependencies
-   **`next`**: v15.3.8 (React framework with App Router)
-   **`react`**: v18.3.1
-   **`typescript`**: v5
-   **`tailwindcss`**: v3.4.1 (Utility-first CSS framework)
-   **`lucide-react`**: For icons.
-   **`class-variance-authority` & `clsx`**: For creating dynamic component styles.
-   **`@radix-ui/*`**: The headless component primitives that power ShadCN UI.
-   **`recharts`**: For data visualization charts.
-   **`embla-carousel-react`**: For creating carousels.
-   **`react-hook-form` & `@hookform/resolvers`**: For managing complex forms.
-   **`wav`**: For converting PCM audio from the TTS model into a playable WAV format.
