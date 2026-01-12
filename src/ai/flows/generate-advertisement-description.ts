
'use server';
/**
 * @fileOverview Generates a detailed video advertisement prompt.
 */

import { ai } from '@/ai/genkit';
import {
    GenerateAdvertisementDescriptionInputSchema,
    GenerateAdvertisementDescriptionOutputSchema,
    type GenerateAdvertisementDescriptionInput,
    type GenerateAdvertisementDescriptionOutput
} from './generate-advertisement-types';

export async function generateAdvertisementDescription(
    input: GenerateAdvertisementDescriptionInput
): Promise<GenerateAdvertisementDescriptionOutput> {
    return generateAdvertisementDescriptionFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateAdvertisementDescriptionPrompt',
    input: { schema: GenerateAdvertisementDescriptionInputSchema },
    output: { schema: GenerateAdvertisementDescriptionOutputSchema },
    prompt: `You are a creative director. Analyze the provided images and write a short, elegant, and detailed prompt for a video generation model like Veo.
    The goal is to create an 8-second video advertisement for an artisan's products.

    The prompt should describe a scene that is:
    - Based on the content of the images provided.
    - Artistic, authentic, and high-quality.
    - Highlights the craftsmanship and beauty of the products shown in the images.
    - Evokes a feeling of creativity and passion.
    - Includes instructions for smooth transitions between shots if multiple images are used as reference.
    - Includes a request for elegant, ambient background music to enhance the mood.
    
    Example: "A cinematic shot of beautifully crafted handmade products with elegant, ambient background music. Smoothly transition between shots of a ceramic vase and a delicate glass sculpture, highlighting the textures and light interplay. The overall mood should be artistic, authentic, and high-quality, showcasing the passion and skill of the creator."

    Now, generate a new prompt based on the following images:
    {{#each images}}
    {{media url=this.url}}
    {{/each}}
    `,
});

const generateAdvertisementDescriptionFlow = ai.defineFlow(
    {
        name: 'generateAdvertisementDescriptionFlow',
        inputSchema: GenerateAdvertisementDescriptionInputSchema,
        outputSchema: GenerateAdvertisementDescriptionOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        if (!output) {
            throw new Error("Failed to generate advertisement description.");
        }
        return output;
    }
);
