
'use server';
/**
 * @fileOverview Generates a video advertisement from product images and a prompt.
 * - generateAdvertisement - A function that handles the video generation.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {
    GenerateAdvertisementInput,
    GenerateAdvertisementInputSchema,
    GenerateAdvertisementOutput,
    GenerateAdvertisementOutputSchema
} from './generate-advertisement-types';


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
  async ({ prompt, images }) => {

    const promptParts = [
        { text: prompt },
        ...images.map(image => ({ media: { url: image.url, contentType: image.contentType } })),
    ];
    
    // Asynchronous call to the video generation model.
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
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
      description: `A promotional video generated based on the provided images and prompt.`,
    };
  }
);
