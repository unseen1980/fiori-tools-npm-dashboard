export async function fectNpmPackageByVersion(name: any, version: any) {
  const endpoint = `https://registry.npmjs.org/${name}/${version}`;
  const res = await fetch(endpoint);
  const d = await res.json();
  return d;
}

export async function fectNpmPackage(name: any) {
  const endpoint = `https://registry.npmjs.org/${name}`;
  const res = await fetch(endpoint);
  const data = await res.json();
  return data;
}

export async function searchNpmRegistry(text: any) {
  const endpoint = `https://registry.npmjs.org/-/v1/search?text=${text}`;
  const res = await fetch(endpoint);
  const data = await res.json();
  return data.objects.map((d: { package: { name: any } }) => d?.package?.name);
}

export function bytesToSize(bytes: number, decimals = 2, includeSize = false) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${
    includeSize ? sizes[i] : ""
  }`;
}

function day(s: string | Date) {
  if (!(s instanceof Date)) {
    if (!Date.parse(s)) {
      return null;
    }
    s = new Date(s);
  }
  return s.toISOString().substr(0, 10);
}

export async function downloadCounts(pkg: string, start: any, end: any) {
  const endpoint =
    "https://api.npmjs.org/downloads/range/" +
    day(start) +
    ":" +
    day(end) +
    "/" +
    pkg;
  const res = await fetch(endpoint);
  const data = await res.json();
  return data.downloads;
}

export function getPercent(num1: number, num2: number) {
  const result = ((num2 - num1) / num1) * 100;
  return result.toFixed(2);
}
