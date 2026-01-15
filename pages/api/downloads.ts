import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { pkg, start, end } = req.query;

    if (!pkg || !start || !end) {
        return res.status(400).json({ error: 'Missing required parameters: pkg, start, end' });
    }

    const endpoint = `https://api.npmjs.org/downloads/range/${start}:${end}/${encodeURIComponent(String(pkg))}`;

    try {
        const response = await fetch(endpoint);

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
        console.error('Error fetching download counts:', error);
        return res.status(500).json({ error: 'Failed to fetch download counts', downloads: [] });
    }
}
