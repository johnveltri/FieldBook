import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'docs/product/current-product.html');
const destination = path.join(root, 'docs/product/chatgpt');
await mkdir(destination, { recursive: true });
await Promise.all([
  copyFile(source, path.join(destination, 'fieldsolo-current-product.html')),
  copyFile(source, path.join(destination, 'fieldsolo-current-product.html.txt')),
]);
console.log('Exported HTML and .html.txt fallback to docs/product/chatgpt/.');
