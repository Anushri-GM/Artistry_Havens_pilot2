
import { z } from 'zod';

// Define the input schema for the flow
export const GenerateAdvertisementInputSchema = z.object({
  prompt: z.string().describe('The detailed text prompt for the video generation.'),
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

export const GenerateAdvertisementDescriptionInputSchema = z.object({
    images: z.array(z.object({
        url: z.string().describe("A product photo as a data URI."),
        contentType: z.string().describe('The MIME type of the image.'),
    })).describe("An array of product images to use for generating the description."),
});
export type GenerateAdvertisementDescriptionInput = z.infer<typeof GenerateAdvertisementDescriptionInputSchema>;

export const GenerateAdvertisementDescriptionOutputSchema = z.object({
    description: z.string().describe("The generated detailed prompt for video creation."),
});
export type GenerateAdvertisementDescriptionOutput = z.infer<typeof GenerateAdvertisementDescriptionOutputSchema>;
