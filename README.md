# Tippit

Tippit is a decentralized tipping platform built on Solana that enables users to submit content and receive cryptocurrency tips from the community. The platform connects creators with supporters through a seamless, blockchain-based reward system.

## Features

- **Content Submissions**: Users can submit content with titles, links, descriptions, and geolocation
- **Solana Integration**: Built-in wallet connection and transaction support
- **Tip Management**: Set tip jar limits and track tip amounts
- **Admin Dashboard**: Review and moderate submissions
- **Leaderboard**: Track the most popular and well-tipped content
- **Responsive Design**: Full mobile support with adaptive UI components

## Project Structure

```
/src
  /app         # Next.js app router structure
  /components  # React components
  /hooks       # Custom React hooks
  /lib         # Core utilities and shared logic
  /providers   # Context providers
  /schemas     # Zod validation schemas
  /types       # TypeScript type definitions
  /utils       # Helper functions
/prisma        # Database schema and migrations
```

## Data Models

The application uses the following core data models:

- **User**: Wallet-connected users who can create submissions and send tips
- **Submission**: Content submissions with metadata and tip jar limits
- **Tip**: Individual tip transactions with amounts and transaction signatures

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- PostgreSQL database
- Solana wallet (Phantom, Solflare, etc.)

### Installation

1. Clone the repository

```bash
git clone https://github.com/takshakmudgal/tippit.git
cd tippit
```

2. Install dependencies

```bash
pnpm install
```

3. Set up environment variables

```bash
# Create a .env file with the following variables
POSTGRES_URL="postgresql://username:password@localhost:5432/tippit"
# Add any other required environment variables
```

4. Run database migrations

```bash
pnpm prisma migrate dev
```

5. Start the development server

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) to view the application

## Development

### Key Components

- **Submission**: Handles the creation and listing of user submissions
- **Wallet Integration**: Manages Solana wallet connections and transactions
- **Tipping System**: Processes and validates tip transactions

### API Routes

The application uses Next.js API routes for server-side operations:

- `/api/v1/user` - User creation and authentication
- `/api/v1/submission` - Manage content submissions
- `/api/v1/tip` - Process tipping transactions

## Deployment

The application is designed to be deployed on Vercel, but can be deployed on any platform that supports Next.js applications.

```bash
pnpm build
pnpm start
```

## License

This project is open source.
