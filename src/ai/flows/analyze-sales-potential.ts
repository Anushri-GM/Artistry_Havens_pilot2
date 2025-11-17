
'use server';
/**
 * @fileOverview An AI flow that analyzes the sales potential of a product.
 *
 * - analyzeSalesPotential - A function that handles the sales potential analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { translateText } from '@/services/translation-service';
import { textToSpeech } from './text-to-speech';

const AnalyzeSalesPotentialInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('The description of the product.'),
  productCategory: z.string().describe('The category of the product.'),
  productPrice: z.number().describe('The price of the product in INR.'),
  targetLanguage: z.string().optional().describe('The optional language to translate the output to.'),
});
export type AnalyzeSalesPotentialInput = z.infer<typeof AnalyzeSalesPotentialInputSchema>;

const AnalyzeSalesPotentialOutputSchema = z.object({
  analysis: z.string().describe('A concise analysis of the product\'s market position, considering its price, category, and description.'),
  suggestions: z.string().describe('Actionable suggestions for improving the product\'s marketability, such as price adjustments, marketing angles, or description enhancements.'),
  predictedPerformance: z.enum(['Low', 'Medium', 'High']).describe('A prediction of the product\'s sales performance (Low, Medium, or High) based on the analysis.'),
  analysisAudio: z.string().describe('A data URI containing the base64 encoded WAV audio of the combined analysis and suggestions.'),
});
export type AnalyzeSalesPotentialOutput = z.infer<typeof AnalyzeSalesPotentialOutputSchema>;

export async function analyzeSalesPotential(input: AnalyzeSalesPotentialInput): Promise<AnalyzeSalesPotentialOutput> {
  return analyzeSalesPotentialFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSalesPotentialPrompt',
  input: { schema: z.object({
    productName: z.string(),
    productDescription: z.string(),
    productCategory: z.string(),
    productPrice: z.number(),
    historicalContext: z.string()
  }) },
  output: { schema: z.object({
    analysis: AnalyzeSalesPotentialOutputSchema.shape.analysis,
    suggestions: AnalyzeSalesPotentialOutputSchema.shape.suggestions,
    predictedPerformance: AnalyzeSalesPotentialOutputSchema.shape.predictedPerformance,
  }) },
  prompt: `You are an expert e-commerce consultant for artisans in India. Your task is to analyze the sales potential of a new product based on its details and mock historical sales data. Provide your analysis in English.

Historical Sales Context for the Indian Market:
{{{historicalContext}}}

Product to Analyze:
- Name: {{{productName}}}
- Category: {{{productCategory}}}
- Price: ₹{{{productPrice}}}
- Description: {{{productDescription}}}

Based on the historical context and the product details, provide the following:
1.  **Analysis:** A brief analysis of the product's market position. Consider its category appeal, price point relative to similar items, and how the description positions it.
2.  **Suggestions:** Provide 2-3 concrete, actionable suggestions for the artisan. These could include adjusting the price, targeting a specific audience, or improving the product description.
3.  **Predicted Performance:** Based on your analysis, predict the sales performance as 'Low', 'Medium', or 'High'.
`,
});

const analyzeSalesPotentialFlow = ai.defineFlow(
  {
    name: 'analyzeSalesPotentialFlow',
    inputSchema: AnalyzeSalesPotentialInputSchema,
    outputSchema: AnalyzeSalesPotentialOutputSchema,
  },
  async ({ productName, productDescription, productCategory, productPrice, targetLanguage }) => {

    // Mock historical data for context
    const historicalContext = `
      - 'Pottery' and 'Jewelry' are the highest-selling categories.
      - Products priced between ₹50 and ₹150 have the highest sales volume.
      - 'Textiles' sell well, but are very price-sensitive; items over ₹80 see a sharp drop-off.
      - 'Paintings' are a luxury item; they sell less frequently but at much higher price points (avg. ₹250).
      - Unique stories and detailed descriptions that mention the creation process significantly boost sales across all categories.
    `;
    
    // The AI prompt is always in English, so we get the analysis in English first.
    const { output } = await prompt({
      productName,
      productDescription,
      productCategory,
      productPrice,
      historicalContext,
    });

    if (!output) {
      throw new Error("Failed to get analysis from the AI model.");
    }
    
    let { analysis, suggestions, predictedPerformance } = output;

    // If a different target language is specified, translate the output fields.
    if (targetLanguage && targetLanguage !== 'en') {
      const translationResult = await translateText({
        texts: [analysis, suggestions],
        targetLanguage,
      });

      if (translationResult.translatedTexts.length === 2) {
        analysis = translationResult.translatedTexts[0];
        suggestions = translationResult.translatedTexts[1];
      }
    }

    // Generate audio from the final (potentially translated) text.
    const combinedTextForAudio = `${analysis}\n\n${suggestions}`;
    const analysisAudio = await textToSpeech(combinedTextForAudio);

    return {
      analysis,
      suggestions,
      predictedPerformance,
      analysisAudio,
    };
  }
);
