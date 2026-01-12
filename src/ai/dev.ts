
'use server';
import { config } from 'dotenv';
config({ path: `.env.local` });
config();

if (!process.env.GEMINI_API_KEY) {
    console.warn(
      'WARNING: GEMINI_API_KEY is not set. \n' +
      'AI-powered features may not work. \n' +
      'Please add your API key to a .env.local file in the root of your project.\n' +
      'Example: GEMINI_API_KEY=your_api_key_here'
    );
}

import '@/ai/flows/generate-product-details.ts';
import '@/ai/flows/translate-text.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/buyer-ai-designed-products.ts';
import '@/ai/flows/interpret-navigation-command.ts';
import '@/ai/flows/community-trend-insights.ts';
import '@/ai/flows/generate-advertisement.ts';
