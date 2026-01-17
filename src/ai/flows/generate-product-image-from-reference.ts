'use server';
/**
 * @fileOverview An AI flow that generates a new product image based on a user's prompt and a reference image.
 */

import { ai } from '@/ai/genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import { z } from 'zod';

const GenerateProductImageFromReferenceInputSchema = z.object({
  prompt: z.string().describe("The buyer's description of the desired changes."),
  referenceImageUrl: z.string().describe("A data URI of the reference image provided by the user. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateProductImageFromReferenceInput = z.infer<typeof GenerateProductImageFromReferenceInputSchema>;

// The output is a string, which will contain the base64 data URI of the generated image.
const GenerateProductImageFromReferenceOutputSchema = z.string().describe('A data URI of the generated image.');
export type GenerateProductImageFromReferenceOutput = z.infer<typeof GenerateProductImageFromReferenceOutputSchema>;

export async function generateProductImageFromReference(input: GenerateProductImageFromReferenceInput): Promise<GenerateProductImageFromReferenceOutput> {
    return generateProductImageFromReferenceFlow(input);
}


const generateProductImageFromReferenceFlow = ai.defineFlow(
  {
    name: 'generateProductImageFromReferenceFlow',
    inputSchema: GenerateProductImageFromReferenceInputSchema,
    outputSchema: GenerateProductImageFromReferenceOutputSchema,
  },
  async ({ prompt, referenceImageUrl }) => {
    
    const { media } = await ai.generate({
      model: vertexAI.model('gemini-2.5-flash-image-preview'),
      prompt: [
        { media: { url: referenceImageUrl } },
        { text: `Based on the provided image, generate a new photorealistic image of a handmade artisan craft with the following modifications: "${prompt}". The new image should be well-lit, on a clean background, as if for an e-commerce product page. Return ONLY the new image.` },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a valid media URL.');
    }

    return media.url;
  }
);
