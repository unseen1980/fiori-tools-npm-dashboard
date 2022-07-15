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

export function bytesToSize(bytes: number) {
  var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Byte";
  //@ts-ignore
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  //@ts-ignore
  return Math.round(bytes / Math.pow(1024, i), 2);
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
