# Fiori Tools NPM Dashboard

A dashboard to monitor SAP Fiori Tools npm packages, showing download statistics, version information, and package details.

**Live Demo:** [https://fiori-tools-npm-dashboard.vercel.app/](https://fiori-tools-npm-dashboard.vercel.app/)

## Features

- 📊 View all @sap-ux and selected @sap npm packages
- 📈 Total download statistics for the last 30 days
- 🔍 Search and filter packages
- 📦 Sort by name, version, or size
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **Framework:** Next.js
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Data Source:** npm Registry API

## Development

### Prerequisites

- Node.js 18+
- npm

### Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Automated Download Count Updates

The dashboard displays total npm download counts for all tracked packages. This data is updated automatically via GitHub Actions.

### How It Works

1. **GitHub Actions Workflow** (`.github/workflows/update-downloads.yml`) runs daily at 6:00 AM UTC
2. The **update script** (`scripts/update-downloads.js`) fetches download counts from npm API
3. The script updates the embedded cache in `pages/api/bulk-downloads.ts`
4. Changes are committed and pushed, triggering a Vercel deployment

### Manual Update

To manually update download counts:

```bash
# Run the update script locally
node scripts/update-downloads.js

# Or trigger the GitHub Action manually via GitHub UI:
# Go to Actions → "Update NPM Downloads" → "Run workflow"
```

### Why Embedded Data?

The download count is embedded directly in the API code rather than fetched at runtime because:
- Vercel serverless functions have a 10-second timeout (Hobby plan)
- Fetching 90+ packages from npm API takes longer than this limit
- Embedded data ensures fast, reliable responses

## Project Structure

```
├── .github/workflows/     # GitHub Actions
│   └── update-downloads.yml
├── components/            # React components
├── helpers/               # Utility functions
├── hooks/                 # Custom React hooks
├── pages/                 # Next.js pages
│   ├── api/              # API routes
│   │   ├── bulk-downloads.ts  # Download stats API
│   │   └── downloads.ts       # Individual package downloads
│   └── index.tsx         # Main dashboard
├── public/               # Static assets
├── scripts/              # Automation scripts
│   └── update-downloads.js
├── styles/               # Global styles
└── types/                # TypeScript types
```

## Deployment

The app is deployed on Vercel and auto-deploys on every push to `main`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/unseen1980/fiori-tools-npm-dashboard)

## License

MIT