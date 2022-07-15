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
