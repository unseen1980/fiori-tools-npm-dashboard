import type { NextApiRequest, NextApiResponse } from 'next';

interface DownloadResult {
    package: string;
    downloads: number;
}

interface BulkDownloadsResponse {
    total: number;
    packages: DownloadResult[];
    error?: string;
    cached?: boolean;
    fetchedAt?: string;
}

interface CachedData {
    total: number;
    packages: DownloadResult[];
    timestamp: number;
    fetchedAt: string;
}

// In-memory cache (for current process - works on Vercel within same invocation)
let memoryCache: CachedData | null = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Vercel serverless timeout is 10s (hobby) or 60s (pro)
// So we use the static cache file for production
const IS_VERCEL = process.env.VERCEL === '1';

// Function to fetch downloads for a single package with retry
async function fetchPackageDownloads(pkg: string, retries = 2): Promise<DownloadResult> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const endpoint = `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(pkg)}`;
            const response = await fetch(endpoint, { signal: controller.signal });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                return { package: pkg, downloads: data.downloads || 0 };
            }

            if (response.status === 429 && attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
        } catch {
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 500));
                continue;
            }
        }
    }
    return { package: pkg, downloads: 0 };
}

// Pre-computed download statistics (updated periodically)
// This is embedded directly to avoid filesystem access issues on serverless platforms
const STATIC_CACHE: CachedData = {
    total: 17856861,
    packages: [],
    timestamp: 1737971700000,
    fetchedAt: '2025-01-27T09:55:00.000Z'
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<BulkDownloadsResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ total: 0, packages: [], error: 'Method not allowed' });
    }

    const { packages } = req.body as { packages: string[] };

    if (!packages || !Array.isArray(packages) || packages.length === 0) {
        return res.status(400).json({ total: 0, packages: [], error: 'Missing or invalid packages array' });
    }

    // Check memory cache first
    if (memoryCache && (Date.now() - memoryCache.timestamp) < CACHE_DURATION_MS) {
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).json({
            total: memoryCache.total,
            packages: memoryCache.packages,
            cached: true,
            fetchedAt: memoryCache.fetchedAt
        });
    }

    // On Vercel (production), use embedded static cache to avoid timeout
    if (IS_VERCEL) {
        memoryCache = STATIC_CACHE;
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).json({
            total: STATIC_CACHE.total,
            packages: STATIC_CACHE.packages || [],
            cached: true,
            fetchedAt: STATIC_CACHE.fetchedAt
        });
    }

    // Local development: fetch fresh data
    try {
        console.log(`Starting sequential fetch for ${packages.length} packages...`);

        const results: DownloadResult[] = [];
        let totalDownloads = 0;

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            const result = await fetchPackageDownloads(pkg);
            results.push(result);
            totalDownloads += result.downloads;

            // Wait between requests to avoid rate limiting
            if (i < packages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 750));
            }

            if ((i + 1) % 20 === 0) {
                console.log(`Progress: ${i + 1}/${packages.length} packages fetched`);
            }
        }

        console.log(`Fetch complete: total: ${totalDownloads.toLocaleString()}`);

        const fetchedAt = new Date().toISOString();
        memoryCache = {
            total: totalDownloads,
            packages: results,
            timestamp: Date.now(),
            fetchedAt
        };

        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).json({ total: totalDownloads, packages: results, fetchedAt });
    } catch (error) {
        console.error('Error fetching bulk download counts:', error);
        return res.status(500).json({ total: 0, packages: [], error: 'Failed to fetch download counts' });
    }
}
