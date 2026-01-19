
'use server';
/**
 * @fileOverview An AI flow that generates custom product images and predicts a price for buyers.
 */

import { ai } from '@/ai/genkit';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { translateText } from '@/services/translation-service';
import { 
    type BuyerAiDesignedProductsInput, 
    type BuyerAiDesignedProductsOutput,
    BuyerAiDesignedProductsInputSchema,
    BuyerAiDesignedProductsOutputSchema
} from './buyer-ai-designed-products-types';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const pricePredictionPrompt = ai.definePrompt({
  name: 'pricePredictionPrompt',
  input: { schema: z.object({ description: z.string(), imageUrl: z.string() }) },
  output: { schema: z.object({ price: z.number() }) },
  prompt: `You are an expert appraiser of artisanal crafts in India. Based on the following description and image of a custom product, estimate a fair market price in Indian Rupees (₹).
  Consider materials, complexity, and artistic value.
  Return only a JSON object with a single key "price" containing the estimated price as a number.

  Description: {{{description}}}
  Image: {{media url=imageUrl}}`,
});


const generateProductImageAndPriceFlow = ai.defineFlow(
  {
    name: 'generateProductImageAndPriceFlow',
    inputSchema: BuyerAiDesignedProductsInputSchema,
    outputSchema: BuyerAiDesignedProductsOutputSchema,
  },
  async ({ prompt: userInput, style, language }) => {

    let englishPrompt = userInput;

    // Translate the prompt to English if it's not already.
    if (language && language !== 'en' && userInput) {
        const translationResponse = await translateText({
            texts: [userInput],
            targetLanguage: 'en',
        });
        if (translationResponse.translatedTexts.length > 0 && translationResponse.translatedTexts[0]) {
            englishPrompt = translationResponse.translatedTexts[0];
        }
    }

    // Step 1: Generate the image
    const { media } = await ai.generate({
      model: googleAI.model('imagen-4.0-fast-generate-001'),
      prompt: `A single, photorealistic image of a handmade artisan craft. The product should be: "${englishPrompt}". The craft style is ${style}. The image should be well-lit, on a clean background, as if for an e-commerce product page.`,
      config: {
        numberOfImages: 1,
      }
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a valid media URL.');
    }
    const imageUrl = media.url;

    // Step 2: Predict the price using the generated image and description
    const priceResponse = await pricePredictionPrompt({
      description: englishPrompt,
      imageUrl: imageUrl,
    });
    
    const predictedPrice = priceResponse.output?.price;

    if (typeof predictedPrice !== 'number') {
      console.error('Price prediction failed, using fallback price.');
      // Fallback price in case of failure
      return {
        imageUrl: imageUrl,
        predictedPrice: 100 + Math.floor(Math.random() * 400),
      };
    }

    // Step 3: Return both the image URL and the predicted price
    return {
      imageUrl: imageUrl,
      predictedPrice: Math.round(predictedPrice),
    };
  }
);


export async function buyerAiDesignedProducts(input: BuyerAiDesignedProductsInput): Promise<BuyerAiDesignedProductsOutput> {
  const fallbackImage = PlaceHolderImages.find(p => p.id === 'product-7')?.imageUrl || 'https://picsum.photos/seed/fallback/512/512';
  
  try {
    const result = await generateProductImageAndPriceFlow(input);
    return result;

  } catch (error) {
    console.error('Error in AI design and price flow, returning fallback.', error);
    return {
        imageUrl: fallbackImage,
        predictedPrice: 150
    };
  }
}
