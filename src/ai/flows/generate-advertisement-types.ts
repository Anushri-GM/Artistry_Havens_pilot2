
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
