import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

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

// Path to the cache file (in project root)
const CACHE_FILE = path.join(process.cwd(), 'downloads-cache.json');
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache (for current process)
let memoryCache: CachedData | null = null;

// Track if a fetch is in progress to prevent multiple simultaneous fetches
let fetchInProgress = false;

// Load cache from file
async function loadCache(): Promise<CachedData | null> {
    try {
        const data = await fs.readFile(CACHE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return null;
    }
}

// Save cache to file
async function saveCache(data: CachedData): Promise<void> {
    try {
        await fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2));
        console.log(`Cache saved to ${CACHE_FILE}`);
    } catch (error) {
        console.error('Failed to save cache file:', error);
    }
}

// Function to fetch downloads for a single package with retry
async function fetchPackageDownloads(pkg: string, retries = 3): Promise<DownloadResult> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const endpoint = `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(pkg)}`;
            const response = await fetch(endpoint, { signal: controller.signal });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                return { package: pkg, downloads: data.downloads || 0 };
            }

            if (response.status === 429 && attempt < retries) {
                const waitTime = 2000 * (attempt + 1);
                console.log(`Rate limited on ${pkg}, waiting ${waitTime}ms before retry ${attempt + 1}...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            console.error(`Failed to fetch ${pkg}: ${response.status}`);
        } catch (error) {
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                continue;
            }
            console.error(`Error fetching ${pkg}:`, error);
        }
    }
    return { package: pkg, downloads: 0 };
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<BulkDownloadsResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ total: 0, packages: [], error: 'Method not allowed' });
    }

    const { packages, forceRefresh } = req.body as { packages: string[]; forceRefresh?: boolean };

    if (!packages || !Array.isArray(packages) || packages.length === 0) {
        return res.status(400).json({ total: 0, packages: [], error: 'Missing or invalid packages array' });
    }

    // Try memory cache first
    if (!forceRefresh && memoryCache && (Date.now() - memoryCache.timestamp) < CACHE_DURATION_MS) {
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).json({
            total: memoryCache.total,
            packages: memoryCache.packages,
            cached: true,
            fetchedAt: memoryCache.fetchedAt
        });
    }

    // Try file cache
    if (!forceRefresh) {
        const fileCache = await loadCache();
        if (fileCache && (Date.now() - fileCache.timestamp) < CACHE_DURATION_MS) {
            memoryCache = fileCache; // Update memory cache
            res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
            return res.status(200).json({
                total: fileCache.total,
                packages: fileCache.packages,
                cached: true,
                fetchedAt: fileCache.fetchedAt
            });
        }
    }

    // If another request is already fetching, return stale data or loading state
    if (fetchInProgress) {
        const staleCache = memoryCache || await loadCache();
        if (staleCache) {
            return res.status(200).json({
                total: staleCache.total,
                packages: staleCache.packages,
                cached: true,
                fetchedAt: staleCache.fetchedAt
            });
        }
        return res.status(202).json({
            total: 0,
            packages: [],
            error: 'Fetch in progress, please wait...'
        });
    }

    try {
        fetchInProgress = true;
        console.log(`Starting sequential fetch for ${packages.length} packages...`);

        const results: DownloadResult[] = [];
        let totalDownloads = 0;
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            const result = await fetchPackageDownloads(pkg);
            results.push(result);
            totalDownloads += result.downloads;

            if (result.downloads > 0) {
                successCount++;
            } else {
                failCount++;
            }

            // Wait 750ms between requests to avoid rate limiting
            if (i < packages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 750));
            }

            if ((i + 1) % 20 === 0) {
                console.log(`Progress: ${i + 1}/${packages.length} packages fetched`);
            }
        }

        console.log(`Fetch complete: ${successCount} succeeded, ${failCount} failed, total: ${totalDownloads.toLocaleString()}`);

        const fetchedAt = new Date().toISOString();
        const cacheData: CachedData = {
            total: totalDownloads,
            packages: results,
            timestamp: Date.now(),
            fetchedAt
        };

        // Update both caches
        memoryCache = cacheData;
        await saveCache(cacheData);

        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

        return res.status(200).json({
            total: totalDownloads,
            packages: results,
            fetchedAt
        });
    } catch (error) {
        console.error('Error fetching bulk download counts:', error);

        const staleCache = memoryCache || await loadCache();
        if (staleCache) {
            return res.status(200).json({
                total: staleCache.total,
                packages: staleCache.packages,
                cached: true,
                fetchedAt: staleCache.fetchedAt
            });
        }

        return res.status(500).json({ total: 0, packages: [], error: 'Failed to fetch download counts' });
    } finally {
        fetchInProgress = false;
    }
}
