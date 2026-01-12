
'use server';
/**
 * @fileOverview Generates a video advertisement from product images.
 * - generateAdvertisement - A function that handles the video generation.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

// Define the input schema for the flow
export const GenerateAdvertisementInputSchema = z.object({
  artisanName: z.string().describe('The name of the artisan.'),
  productCategories: z.array(z.string()).describe('A list of product categories the artisan specializes in.'),
  images: z
    .array(
      z.object({
        url: z.string().describe("A product photo as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
        contentType: z.string().describe('The MIME type of the image (e.g., "image/jpeg").'),
      })
    )
    .min(1)
    .max(3)
    .describe('An array of 1 to 3 product images.'),
});
export type GenerateAdvertisementInput = z.infer<typeof GenerateAdvertisementInputSchema>;

// Define the output schema for the flow
export const GenerateAdvertisementOutputSchema = z.object({
  videoUrl: z.string().describe('A data URI of the generated MP4 video.'),
  description: z.string().describe('A description of the generated video content.'),
});
export type GenerateAdvertisementOutput = z.infer<typeof GenerateAdvertisementOutputSchema>;

// Exported function that wraps the Genkit flow
export async function generateAdvertisement(
  input: GenerateAdvertisementInput
): Promise<GenerateAdvertisementOutput> {
  return generateAdvertisementFlow(input);
}


// Define the Genkit flow
const generateAdvertisementFlow = ai.defineFlow(
  {
    name: 'generateAdvertisementFlow',
    inputSchema: GenerateAdvertisementInputSchema,
    outputSchema: GenerateAdvertisementOutputSchema,
  },
  async ({ artisanName, productCategories, images }) => {

    const promptText = `Create a short, elegant video advertisement (around 8 seconds) showcasing handmade crafts by an artisan named ${artisanName}. 
    The video should feature these product categories: ${productCategories.join(', ')}. 
    Use the provided images as inspiration, smoothly transitioning between them. 
    The overall mood should be artistic, authentic, and high-quality, highlighting the craftsmanship.
    Generate a video with sound.`;

    const promptParts = [
        { text: promptText },
        ...images.map(image => ({ media: { url: image.url, contentType: image.contentType } })),
    ];
    
    // Asynchronous call to the video generation model
    let { operation } = await ai.generate({
      model: googleAI.model('veo-3.0-generate-preview'),
      prompt: promptParts,
    });

    if (!operation) {
      throw new Error('Video generation did not start an operation.');
    }

    // Poll for the result
    while (!operation.done) {
      // Wait for 5 seconds before checking the status again
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      console.error('Video generation failed:', operation.error);
      throw new Error(`Failed to generate video: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find(p => p.media?.contentType?.startsWith('video/'));
    if (!videoPart?.media?.url) {
      throw new Error('Generated output did not contain a valid video.');
    }

    return {
      videoUrl: videoPart.media.url,
      description: `A promotional video for ${artisanName}, highlighting crafts like ${productCategories.join(', ')}.`,
    };
  }
);

    