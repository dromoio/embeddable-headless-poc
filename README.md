# POC - File Processing Application using Dromo Embeddable and Headless

This is a proof of concept application demonstrating file processing capabilities using both embeddable and headless approaches with Next.js (React 18).

## Architecture Overview

The application is built using Next.js 15 with the App Router and consists of two main approaches for file processing:

### 1. Embeddable Solution (`/src/components/embeddable.tsx`)

- Uses the Dromo Uploader React component for direct file uploads
- Configuration:
  - Schema ID
  - Requires a license key stored in `NEXT_PUBLIC_DROMO_LICENSE_KEY`
- Features:
  - Direct file upload through a UI component
  - Real-time validation and processing
  - Immediate results display
  - User metadata attachment

### 2. Headless Solution (`/src/components/headless.tsx` & `/src/app/api/headless/route.ts`)

- Custom implementation for automation of file processing
- Components:
  - Frontend: Drag-and-drop interface using `react-dropzone`
  - Backend: API route for automation of file processing
  - This approach is using polling to check the status of the file processing, but a webhook could be used as well
- Features:
  - Custom file validation
  - Progress tracking
  - Error handling
  - Review workflow support

## Data Processing

### File Types Supported

- CSV files (`text/csv`)
- Modern Excel files (`.xlsx` - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- Legacy Excel files (`.xls` - `application/vnd.ms-excel`)

### Data Transformation

The application includes a data merging algorithm (`mergeRowsById` function) that:

1. Consolidates multiple rows with the same ID
2. Handles diagnosis codes (up to 9 codes per record)
3. Preserves original data while reorganizing the structure

This happens when we get the results, so the data is gonna be stored in its original format for data integrity purposes. We can use the `mergeRowsById` function to merge the data into a single row for each ID when consuming the data.

### Results Handling

- Results are displayed in the `ResultsArea` component
- Three possible states:
  1. Success: Displays processed data
  2. Needs Review: Shows a review URL, example: Validation errors, multiple sheet excel file imported, etc.
  3. Error: Displays error message

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with required environment variables (see `.env.example` for reference):
   ```
   NEXT_PUBLIC_DROMO_LICENSE_KEY=your_license_key_here
   DROMO_BACKEND_API_KEY=your_backend_api_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Component Structure

```
src/
├── app/
│   ├── api/
│   │   └── headless/
│   │       └── route.ts    # Headless API endpoint
│   ├── layout.tsx          # Root layout with navigation
│   └── page.tsx            # Main page
├── components/
│   ├── embeddable.tsx      # Dromo uploader implementation
│   ├── headless.tsx        # Custom upload implementation
│   ├── results-area.tsx    # Results display component
│   └── ui/                 # Shared UI components
```

## User Data Handling

Both implementations attach user metadata to uploads:

```typescript
{
  id: string;
  name: string;
  email: string;
  companyId: string;
  companyName: string;
}
```

## Error Handling

The application implements comprehensive error handling:

- File type validation
- Upload errors
- Processing errors
- Network issues
- Invalid data formats

## Development Notes

- Built with TypeScript for type safety
- Uses Tailwind CSS for styling
- Follows Next.js 15 best practices

## Getting Started with Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Dropzone](https://react-dropzone.js.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)
