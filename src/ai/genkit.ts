
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      // By not specifying a 'location', Genkit will automatically use
      // the GEMINI_API_KEY from the environment if it's available.
      // This is ideal for local development.
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
