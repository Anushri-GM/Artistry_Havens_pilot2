# Product Requirements Document: Artistry Havens

**Version:** 1.0
**Date:** 2024-10-27
**Status:** Draft

---

## 1. Introduction

### 1.1. Overview
Artistry Havens is a mobile-first, AI-enhanced marketplace designed to connect artisans with a global audience of buyers and sponsors. The platform aims to democratize e-commerce for creators by providing powerful, intuitive tools that handle the technical complexities of running an online business, allowing artisans to focus on their craft.

### 1.2. Problem Statement
Talented artisans, particularly in remote or underserved communities, often lack the technical skills, resources, and platform to market their creations to a global audience. The barriers to entry for e-commerce—such as professional photography, compelling marketing copy, and multi-language support—are significant. Buyers struggle to find unique, authentic handmade goods, and potential sponsors have no direct way to discover and support emerging talent.

### 1.3. Vision & Mission
Our vision is to build a vibrant, global community where creativity is celebrated and sustained. Our mission is to empower artisans by providing a seamless, intelligent platform that removes technical barriers, fosters financial independence, and connects them with a world of appreciative buyers and patrons.

---

## 2. User Personas & Roles

The platform is designed to serve three primary user roles:

### 2.1. The Artisan
- **Goal:** To showcase their craft, build a sustainable business, and connect with a supportive community.
- **Needs:**
    - An easy-to-use platform to create and manage a digital storefront.
    - Tools to make their products look professional without technical expertise.
    - A way to track sales, revenue, and business performance.
    - A secure channel to manage orders and communicate with buyers and sponsors.

### 2.2. The Buyer
- **Goal:** To discover and purchase unique, high-quality handmade items and connect with the stories behind them.
- **Needs:**
    - A curated and intuitive browsing experience.
    - The ability to find specific or customized items that match their vision.
    - A trustworthy platform for transactions and communication with artisans.
    - A way to leave feedback and share their finds with others.

### 2.3. The Sponsor
- **Goal:** To discover and financially support talented artisans, fostering the arts and sharing in their success.
- **Needs:**
    - A transparent way to find artisans whose work they admire.
    - A simple mechanism to provide financial support (e.g., monthly contributions).
    - A dashboard to track the impact of their sponsorships, including revenue generated from the artisans they support.

---

## 3. Key Features (Functional Requirements)

### 3.1. Core Platform Features
- **User Authentication:** Secure sign-in and registration using Phone & OTP for all user roles.
- **Role-Based Experience:** Distinct dashboards, navigation, and functionalities tailored for Artisans, Buyers, and Sponsors.
- **Multilingual Support:** All user-facing text, including AI-generated content, will be translatable to support a global audience.
- **Product Discovery:** Buyers and Sponsors can browse products by category, view trending items, and see best-sellers.

### 3.2. Artisan-Specific Features
- **AI-Powered Product Creation:**
    - Artisans can upload a photo of their craft.
    - The system will use generative AI (Gemini 2.5 Flash) to automatically generate a product name, marketing description, category, and a unique product story.
- **AI Image Enhancement:**
    - A one-click tool (using Gemini 2.5 Flash Image) to enhance product photos by improving lighting, sharpness, and color balance for a professional look.
- **Voice Navigation & Input:**
    - Artisans can navigate their dashboard and input data (like product stories) using voice commands in their native language, powered by AI interpretation.
- **Business Dashboard:**
    - A comprehensive dashboard to visualize key metrics like total revenue, sales volume, and product likes over time using simple charts.
    - AI-powered insights to analyze product performance and suggest improvements.
- **Order Management:**
    - A dedicated interface to view, accept, and manage incoming orders.
- **Sponsor Management:**
    - An interface to review sponsorship requests and manage active partnerships.
- **AI-Generated Advertisements:**
    - An AI-powered tool to generate short, promotional video ads for social media from product images and descriptions (using Veo).
- **AI-Generated Social Media Content:**
    - Generate platform-specific (Instagram, Facebook, etc.) marketing copy and a promotional image (using Imagen 4) to help artisans promote their products.

### 3.3. Buyer-Specific Features
- **AI-Powered Custom Design (Text-to-Image):**
    - Buyers can describe a product idea with text.
    - The system will use generative AI (Imagen 4) to create a visual concept of the custom product.
- **AI-Powered Customization from Reference:**
    - Buyers can upload a reference image and describe desired changes.
    - The system will use generative AI (Gemini 2.5 Flash Image) to generate a new image reflecting those changes.
- **Direct-to-Artisan Commissioning:**
    - Buyers can send their AI-generated designs directly to artisans to initiate a conversation about a custom commission.
- **Product Reviews:**
    - Buyers can leave ratings and text reviews for products they have purchased.

### 3.4. Sponsor-Specific Features
- **Artisan Discovery:**
    - Sponsors can browse artisan profiles and portfolios, sorted by craft category.
- **Sponsorship Portal:**
    - A dedicated interface to send sponsorship requests with proposed contribution terms (e.g., monthly amount, revenue share).
- **Impact Dashboard:**
    - A dashboard showing the total revenue generated from the artisans they sponsor, providing a clear view of their investment's impact.

---

## 4. Non-Functional Requirements

- **Performance:** The application must be fast and responsive, with server-side rendering (SSR) for initial page loads to minimize client-side JavaScript.
- **Scalability:** Built on a serverless architecture (Firebase, Next.js) to automatically scale with user traffic.
- **Security:** All data access will be governed by strict Firestore Security Rules. Authentication will be handled by Firebase Authentication.
- **Usability:** The interface must be mobile-first, intuitive, and accessible to non-technical users.
- **Accessibility:** Components should adhere to ARIA standards for screen readers and keyboard navigation.

---

## 5. Technical Architecture

- **Frontend:** Next.js 15 (App Router) with React and TypeScript.
- **UI:** ShadCN UI component library, styled with Tailwind CSS.
- **Backend Logic:** Firebase Functions and the Next.js server environment.
- **Database:** Cloud Firestore (NoSQL) for all application data.
- **Authentication:** Firebase Authentication (Phone Provider).
- **AI Integration:** Genkit orchestrating calls to Google AI Platform models:
    - **Gemini 2.5 Flash:** For text generation, analysis, and voice interpretation.
    - **Imagen 4:** For text-to-image generation.
    - **Gemini 2.5 Flash Image:** For image editing and enhancement.
    - **Veo:** For text- and image-to-video generation.
    - **TTS (Text-to-Speech):** For audio playback of AI-generated content.
- **Hosting:** Firebase App Hosting.

---

## 6. Data Model

The application will use the following Firestore data model:

- `/users/{userId}`: Stores user profiles for Artisans, Buyers, and Sponsors.
- `/products/{productId}`: Stores all product listings.
- `/products/{productId}/customizationOptions/{optionId}`: Nested options for a product.
- `/orders/{orderId}`: Stores all purchase orders.
- `/reviews/{reviewId}`: Stores all product reviews.

*(For a detailed schema definition of each entity, refer to `docs/backend.json`)*.
