
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
    prompt: `You are a creative director. Analyze the provided images and write a short, elegant, and detailed prompt for a video generation model.
    The goal is to create an 8-second video advertisement for an artisan's products.

    The prompt should describe a scene that is:
    - Based *only* on the visual content of the images provided.
    - Artistic, authentic, and high-quality.
    - Highlights the craftsmanship, textures, and beauty of the products shown.
    - Evokes a feeling of creativity and passion.
    - **Crucially, the prompt must avoid any descriptions of people, faces, individuals, or potentially ambiguous actions. It must also avoid any themes related to violence, derogatory content, sexual content, or toxic language.** Focus entirely on the product and the cinematic style.
    
    Example: "A cinematic, slow-panning shot of a beautifully crafted ceramic vase. Light softly illuminates the intricate textures of the glaze. Transition to a delicate glass sculpture, highlighting the interplay of light and shadow. The overall mood is artistic and high-quality."

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
