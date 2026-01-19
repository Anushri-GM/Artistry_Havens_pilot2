import { z } from 'genkit';

export const BuyerAiDesignedProductsInputSchema = z.object({
  prompt: z.string().describe("The buyer's description of the product."),
  style: z.string().describe('The style or category of the craft.'),
  language: z.string().optional().describe('The language of the prompt.'),
});
export type BuyerAiDesignedProductsInput = z.infer<typeof BuyerAiDesignedProductsInputSchema>;

// The output is now an object containing the image URL and the predicted price.
export const BuyerAiDesignedProductsOutputSchema = z.object({
  imageUrl: z.string().describe('A data URI of the generated image.'),
  predictedPrice: z.number().describe('The AI-predicted price for the custom item.'),
});
export type BuyerAiDesignedProductsOutput = z.infer<typeof BuyerAiDesignedProductsOutputSchema>;
