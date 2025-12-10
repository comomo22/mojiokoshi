# Whisper Web Frontend

Next.js frontend for the Whisper Web transcription service.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy the environment variables file:
```bash
cp .env.local.example .env.local
```

3. Update the environment variables in `.env.local` with your actual values.

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` - Next.js App Router pages and layouts
  - `(auth)/` - Authentication pages (login, signup)
  - `(dashboard)/` - Dashboard pages
- `components/` - Reusable React components
- `lib/` - Utility functions and API clients
  - `supabase/` - Supabase client configurations
  - `api.ts` - Backend API client

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Supabase for authentication
