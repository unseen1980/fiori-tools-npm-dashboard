#!/usr/bin/env node

/**
 * Script to fetch download counts from npm API and update the STATIC_CACHE
 * in pages/api/bulk-downloads.ts
 * 
 * Usage: node scripts/update-downloads.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const NPM_SEARCH_URL = 'https://registry.npmjs.org/-/v1/search?text=@sap-ux&size=250';
const NPM_DOWNLOADS_URL = 'https://api.npmjs.org/downloads/point/last-month';
const SPECIFIC_SAP_PACKAGES = [
    '@sap/generator-fiori',
    '@sap/ux-ui5-tooling',
    '@sap/ux-specification',
    '@sap/ux-ui5-fe-mockserver-middleware'
];
const API_FILE_PATH = path.join(__dirname, '..', 'pages', 'api', 'bulk-downloads.ts');
const DELAY_BETWEEN_REQUESTS = 500; // ms - slightly slower to avoid rate limits
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // ms - wait 5s before retry on rate limit

/**
 * Make an HTTPS GET request
 */
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search npm registry for @sap-ux packages
 */
async function searchSapUxPackages() {
    console.log('Searching for @sap-ux packages...');
    const result = await httpsGet(NPM_SEARCH_URL);
    const packages = result.objects
        .map(obj => obj.package.name)
        .filter(name => name.startsWith('@sap-ux/'));
    console.log(`Found ${packages.length} @sap-ux packages`);
    return packages;
}

/**
 * Fetch download count for a single package with retry logic
 */
async function fetchPackageDownloads(packageName, retryCount = 0) {
    try {
        const url = `${NPM_DOWNLOADS_URL}/${encodeURIComponent(packageName)}`;
        const result = await httpsGet(url);
        return result.downloads || 0;
    } catch (error) {
        // Check if it's a rate limit error (Cloudflare returns non-JSON "error code: 1015")
        const isRateLimit = error.message.includes('Unexpected token');
        
        if (isRateLimit && retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAY * (retryCount + 1);
            console.log(`  Rate limited for ${packageName}, waiting ${delay/1000}s... (retry ${retryCount + 1}/${MAX_RETRIES})`);
            await sleep(delay);
            return fetchPackageDownloads(packageName, retryCount + 1);
        }
        
        console.warn(`  Warning: Could not fetch ${packageName}`);
        return 0;
    }
}

/**
 * Fetch downloads for all packages with progress tracking
 */
async function fetchAllDownloads(packages) {
    console.log(`Fetching download counts for ${packages.length} packages...`);
    let total = 0;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < packages.length; i++) {
        const pkg = packages[i];
        const downloads = await fetchPackageDownloads(pkg);
        
        if (downloads > 0) {
            total += downloads;
            successCount++;
        } else {
            failCount++;
        }
        
        // Progress update every 20 packages
        if ((i + 1) % 20 === 0 || i === packages.length - 1) {
            console.log(`Progress: ${i + 1}/${packages.length} - Total: ${total.toLocaleString()} (${failCount} failed)`);
        }
        
        // Rate limiting with jitter
        if (i < packages.length - 1) {
            await sleep(DELAY_BETWEEN_REQUESTS + Math.random() * 100);
        }
    }

    console.log(`\nFetch complete: ${successCount} succeeded, ${failCount} failed`);
    console.log(`Total downloads: ${total.toLocaleString()}`);
    return total;
}

/**
 * Update the API file with new download count
 */
function updateApiFile(total) {
    console.log('Updating API file...');
    
    const content = fs.readFileSync(API_FILE_PATH, 'utf-8');
    const now = new Date();
    const timestamp = now.getTime();
    const fetchedAt = now.toISOString();
    
    // Update the STATIC_CACHE values using regex
    let updatedContent = content;
    
    // Update total
    updatedContent = updatedContent.replace(
        /total:\s*\d+/,
        `total: ${total}`
    );
    
    // Update timestamp
    updatedContent = updatedContent.replace(
        /timestamp:\s*\d+/,
        `timestamp: ${timestamp}`
    );
    
    // Update fetchedAt
    updatedContent = updatedContent.replace(
        /fetchedAt:\s*'[^']+'/,
        `fetchedAt: '${fetchedAt}'`
    );
    
    // Update the comment with date
    const dateStr = now.toISOString().split('T')[0];
    updatedContent = updatedContent.replace(
        /\/\/ Last updated: \d{4}-\d{2}-\d{2}/,
        `// Last updated: ${dateStr}`
    );
    
    if (content === updatedContent) {
        console.log('No changes needed - values are the same');
        return false;
    }
    
    fs.writeFileSync(API_FILE_PATH, updatedContent, 'utf-8');
    console.log('API file updated successfully');
    return true;
}

/**
 * Main function
 */
async function main() {
    try {
        console.log('=== NPM Downloads Update Script ===\n');
        
        // Get all @sap-ux packages
        const sapUxPackages = await searchSapUxPackages();
        
        // Combine with specific @sap packages
        const allPackages = [...sapUxPackages, ...SPECIFIC_SAP_PACKAGES];
        console.log(`Total packages to fetch: ${allPackages.length}`);
        
        // Fetch downloads for all packages
        const totalDownloads = await fetchAllDownloads(allPackages);
        
        // Update the API file
        const wasUpdated = updateApiFile(totalDownloads);
        
        console.log('\n=== Summary ===');
        console.log(`Packages processed: ${allPackages.length}`);
        console.log(`Total downloads: ${totalDownloads.toLocaleString()}`);
        console.log(`File updated: ${wasUpdated ? 'Yes' : 'No'}`);
        
        // Exit with appropriate code for CI
        process.exit(wasUpdated ? 0 : 0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();