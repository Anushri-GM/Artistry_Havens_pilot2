
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
    prompt: `You are a creative director. Write a short, elegant, and detailed prompt for a video generation model like Veo.
    The goal is to create an 8-second video advertisement for an artisan.

    Artisan's Name: {{{artisanName}}}
    Specializes in: {{#each productCategories}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

    The prompt should describe a scene that is:
    - Artistic, authentic, and high-quality.
    - Highlights the craftsmanship and beauty of the products.
    - Mentions the artisan's name and their craft categories.
    - Evokes a feeling of creativity and passion.
    - Includes instructions for smooth transitions between shots if multiple images are used as reference.
    - Includes instructions to generate sound that complements the mood.
    
    Example: "A cinematic shot of handmade crafts by an artisan named Elena Vance, specializing in Pottery, Glasswork. Smoothly transition between shots of a beautifully crafted ceramic vase and a delicate glass sculpture, highlighting the textures and light interplay. The overall mood should be artistic, authentic, and high-quality, showcasing the passion and skill of the creator. Generate with elegant, ambient background music."

    Now, generate a new prompt based on the provided artisan details.
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
