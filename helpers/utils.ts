import { requestCache } from './requestCache';

export async function fectNpmPackageByVersion(name: string, version: string): Promise<any> {
  const fixedVersion = version.replace(/[\^~]/g, "");
  const endpoint = `https://registry.npmjs.org/${name}/${fixedVersion}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      console.error(`Failed to fetch package ${name}@${version}: ${res.status}`);
      return {};
    }
    const d = await res.json();
    return d;
  } catch (error) {
    console.error(`Error fetching package ${name}@${version}:`, error);
    return {};
  }
}

export async function fectNpmPackage(name: string): Promise<any> {
  const cacheKey = `package:${name}`;
  
  return requestCache.get(cacheKey, async () => {
    const endpoint = `https://registry.npmjs.org/${name}`;
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        console.error(`Failed to fetch package ${name}: ${res.status}`);
        return {};
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`Error fetching package ${name}:`, error);
      return {};
    }
  });
}

export async function searchNpmRegistry(text: string): Promise<string[]> {
  const endpoint = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(text)}&size=250`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      console.error(`Failed to search npm registry: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.objects
      .map((d: { package: { name: string } }) => d?.package?.name)
      .filter((name: string) => name && name.startsWith(text)); // Only packages that actually start with the search term
  } catch (error) {
    console.error('Error searching npm registry:', error);
    return [];
  }
}

// export function bytesToSize(bytes: number, decimals = 2, includeSize = false) {
//   if (bytes === 0) return "0 Bytes";

//   const k = 1024;
//   const dm = decimals < 0 ? 0 : decimals;
//   const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

//   const i = Math.floor(Math.log(bytes) / Math.log(k));

//   return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${
//     includeSize ? sizes[i] : ""
//   }`;
// }

export function bytesToSize(bytes: number, decimals = 2, includeSize = false): string {
  if (bytes === 0) return includeSize ? "0 MB" : "0";
  
  const megabytes = bytes / (1024 * 1024);
  return `${parseFloat(megabytes.toFixed(decimals))}${includeSize ? "MB" : ""}`;
}

function day(s: string | Date): string | null {
  if (!(s instanceof Date)) {
    const parsed = Date.parse(s);
    if (isNaN(parsed)) {
      return null;
    }
    s = new Date(s);
  }
  return s.toISOString().substring(0, 10);
}

export async function downloadCounts(pkg: string, start: Date, end: Date): Promise<any[]> {
  const startDay = day(start);
  const endDay = day(end);
  
  if (!startDay || !endDay) {
    console.error('Invalid date range for download counts');
    return [];
  }
  
  const cacheKey = `downloads:${pkg}:${startDay}:${endDay}`;
  
  return requestCache.get(cacheKey, async () => {
    const endpoint = `https://api.npmjs.org/downloads/range/${startDay}:${endDay}/${encodeURIComponent(pkg)}`;
    
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        console.error(`Failed to fetch download counts for ${pkg}: ${res.status}`);
        return [];
      }
      const data = await res.json();
      return data.downloads || [];
    } catch (error) {
      console.error(`Error fetching download counts for ${pkg}:`, error);
      return [];
    }
  });
}

export function getPercent(num1: number, num2: number): string {
  if (num1 === 0) return "0.00";
  const result = ((num2 - num1) / num1) * 100;
  return result.toFixed(2);
}
