import type { NextApiRequest, NextApiResponse } from 'next';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Basic npm package name shape: optionally scoped (@scope/name)
const PACKAGE_PATTERN = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed', downloads: [] });
    }

    const { pkg, start, end } = req.query;

    if (
        typeof pkg !== 'string' || !PACKAGE_PATTERN.test(pkg) ||
        typeof start !== 'string' || !DATE_PATTERN.test(start) ||
        typeof end !== 'string' || !DATE_PATTERN.test(end)
    ) {
        return res.status(400).json({
            error: 'Invalid parameters: pkg must be a package name and start/end must be YYYY-MM-DD dates',
            downloads: []
        });
    }

    if (start > end) {
        return res.status(400).json({ error: 'Invalid date range: start must be before end', downloads: [] });
    }

    const endpoint = `https://api.npmjs.org/downloads/range/${start}:${end}/${encodeURIComponent(pkg)}`;

    // Abort requests that take too long (Vercel Hobby functions have a 10s limit)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
        const response = await fetch(endpoint, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            return res.status(response.status).json({
                error: `npm API error: ${response.status}`,
                downloads: []
            });
        }

        const data = await response.json();

        // Cache for 1 hour
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

        return res.status(200).json(data);
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error fetching download counts:', error);
        return res.status(500).json({ error: 'Failed to fetch download counts', downloads: [] });
    }
}
