# simon.dev

My personal website built with Next.js 16.

## Features

- Real-time chat powered by Slack
- Coding stats from WakaTime
- Server-Sent Events for live updates

## Development

Requirements:

- Node.js 24
- Corepack enabled

```bash
# Enable corepack if not already enabled
corepack enable

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Lint (ESLint + Prettier)
pnpm lint

# Auto-fix linting issues
pnpm lint:fix
```

## Environment Variables

Create a `.env.local` file with:

```
SESSION_SECRET=your-secret-key
SLACK_CHANNEL=your-channel-id
SLACK_TOKEN=your-slack-token
```

## Deployment

The site is containerized and deployed to Heroku:

```bash
# Build Docker image
docker build -t simon.dev .

# Run locally
docker run -p 3000:3000 simon.dev
```

## License

MIT
