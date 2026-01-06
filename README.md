# Recipe Hub

Recipe Hub is a modern recipe management application built with the [T3 Stack](https://create.t3.gg/). It allows users to organize their favorite recipes, track what they've cooked, and even link video tutorials from various platforms.

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org)
- **Language:** [TypeScript](https://www.typescriptlang.org)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **Database:** [PostgreSQL](https://www.postgresql.org)
- **ORM:** [Prisma](https://www.prisma.io)
- **API:** [tRPC](https://trpc.io)
- **Package Manager:** [pnpm](https://pnpm.io)

## ✨ Features

- **Recipe Management:** Create, read, update, and delete recipes.
- **Detailed Tracking:**
  - Track ingredients, cooking instructions, and preparation times.
  - Categorize by cuisine and difficulty (Easy, Medium, Hard).
  - Add tags for better organization.
- **Progress Tracking:** Mark recipes as "Cooked" to keep track of your culinary adventures.
- **Video Integration:** Link video tutorials directly to recipes from platforms like:
  - YouTube
  - Instagram
  - TikTok

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- pnpm (`npm install -g pnpm`)
- PostgreSQL database (local or cloud-hosted like Supabase/Neon)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd recipe-hub
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Update the `DATABASE_URL` and other variables in `.env`.

### Database Setup

1. **Generate Prisma Client:**

   ```bash
   pnpm db:generate
   ```

2. **Push schema to the database:**

   ```bash
   pnpm db:push
   ```

   _Note: For production database changes, use `pnpm db:migrate`._

### Running the Application

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## 📜 Scripts

- `pnpm dev` - Start the development server.
- `pnpm build` - Build the application for production.
- `pnpm start` - Start the production server.
- `pnpm lint` - Run ESLint to check for code quality issues.
- `pnpm typecheck` - Run TypeScript type checking.
- `pnpm db:studio` - Open Prisma Studio to view/edit database records.

## 📂 Project Structure

- `src/` - Application source code.
- `prisma/` - Database schema and configurations.
- `public/` - Static assets.
