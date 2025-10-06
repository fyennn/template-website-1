import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataPath = path.join(projectRoot, 'src', 'assets', 'data', 'products.json');
const imagesDir = path.join(projectRoot, 'src', 'assets', 'images', 'products');

const slugify = (value) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

async function downloadImage(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, buffer);
}

await mkdir(imagesDir, { recursive: true });

const products = JSON.parse(await readFile(dataPath, 'utf8'));

const toRelativePath = (filename) => path.posix.join('..', 'assets', 'images', 'products', filename);

for (const [category, items] of Object.entries(products)) {
  for (const item of items) {
    const remoteImage = item.image;
    if (!remoteImage || remoteImage.startsWith('../assets/images/products/')) {
      continue;
    }

    const slug = slugify(item.id ?? item.name ?? `${category}-${Math.random().toString(36).slice(2, 8)}`);
    const filename = `${slug}.jpg`;
    const destinationPath = path.join(imagesDir, filename);

    console.log(`Downloading ${item.name ?? slug} → ${filename}`);
    await downloadImage(remoteImage, destinationPath);

    item.image = toRelativePath(filename);
  }
}

await writeFile(dataPath, `${JSON.stringify(products, null, 2)}\n`);

console.log('Images downloaded and product image paths updated.');
