'use server';
/**
 * @fileOverview An AI flow that enhances the quality of a product image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { vertexAI } from '@genkit-ai/vertexai';

const EnhanceProductImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EnhanceProductImageInput = z.infer<typeof EnhanceProductImageInputSchema>;

const EnhanceProductImageOutputSchema = z.string().describe('A data URI of the enhanced image.');
export type EnhanceProductImageOutput = z.infer<typeof EnhanceProductImageOutputSchema>;

export async function enhanceProductImage(input: EnhanceProductImageInput): Promise<EnhanceProductImageOutput> {
  return enhanceProductImageFlow(input);
}

const enhanceProductImageFlow = ai.defineFlow(
  {
    name: 'enhanceProductImageFlow',
    inputSchema: EnhanceProductImageInputSchema,
    outputSchema: EnhanceProductImageOutputSchema,
  },
  async ({ photoDataUri }) => {
    const { media } = await ai.generate({
      model: vertexAI.model('gemini-1.5-flash-001'),
      prompt: [
        { media: { url: photoDataUri } },
        { 
          text: `Enhance this product image for an e-commerce website. Improve the lighting, sharpness, and color balance to make it look more professional. 
          Do not change the craft or product itself. The goal is to make the existing product look its best.
          If the image is a painting or has an intentionally artistic style (e.g., blurry background), preserve that style and do not over-sharpen or 'correct' it.
          Return only the enhanced image.`
        },
      ],
    });

    if (!media?.url) {
      throw new Error('Image enhancement failed to return a valid media URL.');
    }

    return media.url;
  }
);
