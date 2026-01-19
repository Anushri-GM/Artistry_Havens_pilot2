## Text-to-UI Design Specification: Artistry Havens

Generate a responsive, mobile-first web application UI based on the following detailed design system. The application is a marketplace for artisans and has three main user roles: Artisan, Buyer, and Sponsor.

### 1. Visual Hierarchy & Layout

- **Overall Structure:** The application is built as a single-page experience within a centered, fixed-width container that mimics a smartphone screen (max-width of 390px, max-height of 844px). The container has a prominent box shadow.
- **Artisan Flow Layout:**
    - A main content area with a sticky header.
    - The header contains a "hamburger" menu icon (PanelLeft) on the left that triggers a slide-in sidebar from the left.
    - The header also contains action icons on the right (e.g., Voice Command, Notifications, Support).
    - A large, circular Floating Action Button (FAB) with a plus (+) icon is fixed to the bottom-right corner for primary actions like adding a product.
- **Buyer Flow Layout:**
    - A main content area with a sticky top header containing a search bar and action icons.
    - A fixed bottom navigation bar with four icons and labels for primary navigation (Home, Customize, Orders, Profile).
- **Content Organization:**
    - Pages typically start with a large, left-aligned headline (`font-headline`, `text-3xl` or `text-4xl`) and a smaller descriptive paragraph (`text-muted-foreground`).
    - Content is primarily organized using Cards, often arranged in a two-column grid (`grid grid-cols-2 gap-4`).
    - Carousels are used for horizontally scrolling lists of cards (e.g., featured artisans, trending products).

### 2. Component Specifications

- **Buttons:**
    - **Corner Radius:** `0.5rem` (md).
    - **Default Variant:** Solid background color using the Primary color, with Primary Foreground text color. No border.
    - **Outline Variant:** Transparent background with a 1px solid border using the Input color. Text uses the default Foreground color.
    - **Ghost Variant:** Transparent background, no border. Text uses the default Foreground color.
    - **Destructive Variant:** Solid background using the Destructive color, with Destructive Foreground text color.
    - **Sizing:** Default height is `40px` with `px-4`. Icon-only buttons are square (`h-9 w-9`).
- **Cards:**
    - **Corner Radius:** `0.5rem` (lg).
    - **Styling:** 1px solid border using the Border color, a light `shadow-sm`, and a background color of Card.
    - **Structure:** Composed of `CardHeader` (for titles), `CardContent` (for body), and `CardFooter` (for actions). Padding is consistently `p-6` in headers and footers, with content having `p-6 pt-0`.
- **Input Fields & Textareas:**
    - **Corner Radius:** `0.5rem` (md).
    - **Styling:** 1px solid border using the Input color, with a transparent `bg-background`.
    - **State:** When focused, display a 2px solid ring using the Ring color.
    - **Sizing:** Standard height is `40px` with `px-3 py-2`.

### 3. Design Tokens (Colors)

Use the following exact HEX codes for the light theme:
- **Background:** `#FDF5EC` (A very light, pastel cream)
- **Foreground (Default Text):** `#212121` (A near-black for high contrast)
- **Card Background:** `#FEFBF7` (A slightly whiter cream than the main background)
- **Primary:** `#EC2929` (A strong, vibrant red)
- **Primary Foreground (Text on Primary):** `#FEFEFE` (White)
- **Secondary:** `#EDEDED` (A light gray)
- **Secondary Foreground (Text on Secondary):** `#171717` (Dark Gray)
- **Muted / Muted Foreground:** `#EDEDED` / `#737373` (For less important text and subtle backgrounds)
- **Accent:** `#E6E6E6` (A light gray for hover states)
- **Destructive:** `#EC2B2B` (A vibrant red for destructive actions)
- **Border / Input:** `#E3E3E3` (A light gray for all borders and input fields)
- **Ring (Focus Outline):** `#EC2929` (The same vibrant red as Primary)

### 4. Typography

- **Headline Font:** Use "**Lora**", a serif font. Apply it to all main page titles (`<h1>`), card titles (`CardTitle`), and important headings. It should generally be `font-bold` or `font-semibold`.
- **Body Font:** Use "**Open Sans**", a sans-serif font. Apply it to all other text, including descriptions, labels, and button text.
- **Sizing & Weight (Relative to a base size of 16px):**
    - **Page Titles:** `text-3xl` or `text-4xl`, `font-bold`.
    - **Card Titles:** `text-lg` or `text-xl`, `font-semibold`.
    - **Body/Description Text:** `text-sm`, `font-normal`, color `text-muted-foreground`.
    - **Button/Input Text:** `text-sm`, `font-medium`.
    - **Labels:** `text-sm`, `font-medium`.

### 5. Spacing & Density

- **Layout Density:** The design is spacious and clean. Use a consistent 4-point grid system for spacing.
- **Padding:**
    - Main page containers should have a padding of `p-4`.
    - Card headers and footers use a larger padding of `p-6`.
    - Card content follows with `p-6` but with `pt-0`.
- **Margins & Gaps:**
    - Use `gap-4` for grids of cards.
    - Use `space-y-4` or `space-y-6` for vertical stacking of form elements and sections within cards.
    - Separator components (`<hr>`) are used to divide distinct sections within a card.
