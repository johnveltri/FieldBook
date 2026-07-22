import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlOnly = process.argv.includes('--html-only');
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function json(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
}

function valuesForAttribute(html, attribute) {
  return [...html.matchAll(new RegExp(`${attribute}="([^"]+)"`, 'g'))].map((match) => match[1]);
}

function duplicates(values) {
  const seen = new Set();
  return [...new Set(values.filter((value) => seen.has(value) || !seen.add(value)))];
}

const htmlPath = 'docs/product/current-product.html';
const html = await readFile(path.join(root, htmlPath), 'utf8');
check(/^<!doctype html>/i.test(html), 'current-product.html must begin with an HTML doctype');
check(!/<script\b/i.test(html), 'current-product.html must not contain JavaScript');
check(!/<link\b[^>]*rel=["']?stylesheet/i.test(html), 'current-product.html must not use external stylesheets');
check(!/@import\s/i.test(html), 'current-product.html must not import remote CSS');
check(!/<(?:img|source)\b[^>]*\bsrc=["']https?:/i.test(html), 'current-product.html must not load remote images');
check(!/\`\`\`/.test(html), 'current-product.html must not contain Markdown code fences');

const requiredMeta = {
  'fieldsolo-source-commit': '50822e52f3c1b1e3ba758e02a875d624d2983024',
  'fieldsolo-reviewed-at': '2026-07-21',
  'fieldsolo-product-version': '2026.07.21',
};
for (const [name, value] of Object.entries(requiredMeta)) {
  check(
    new RegExp(`<meta\\s+name="${name}"\\s+content="${value}"`).test(html),
    `missing or incorrect meta ${name}`,
  );
}

for (const status of ['shipped', 'approved-not-shipped', 'exploring']) {
  check(html.includes(`data-status="${status}"`), `missing explicit ${status} container`);
}

const indexMatch = html.match(/<pre id="fieldsolo-product-index">([\s\S]*?)<\/pre>/);
check(Boolean(indexMatch), 'missing visible fieldsolo-product-index');
let productIndex = null;
if (indexMatch) {
  try {
    productIndex = JSON.parse(indexMatch[1]);
  } catch (error) {
    failures.push(`fieldsolo-product-index is not valid JSON: ${error.message}`);
  }
}

if (productIndex) {
  const visibleScreenIds = [
    ...valuesForAttribute(html, 'data-screen-id'),
    ...valuesForAttribute(html, 'data-state-id'),
  ];
  const indexedScreenIds = productIndex.screens.map((screen) => screen.id);
  const visibleCapabilityIds = valuesForAttribute(html, 'data-capability-id');
  const indexedCapabilityIds = productIndex.capabilities.map((capability) => capability.id);
  check(duplicates(visibleScreenIds).length === 0, `duplicate visible screen/state IDs: ${duplicates(visibleScreenIds).join(', ')}`);
  check(duplicates(indexedScreenIds).length === 0, `duplicate indexed screen IDs: ${duplicates(indexedScreenIds).join(', ')}`);
  check(duplicates(visibleCapabilityIds).length === 0, `duplicate visible capability IDs: ${duplicates(visibleCapabilityIds).join(', ')}`);
  check(duplicates(indexedCapabilityIds).length === 0, `duplicate indexed capability IDs: ${duplicates(indexedCapabilityIds).join(', ')}`);
  check(
    JSON.stringify([...visibleScreenIds].sort()) === JSON.stringify([...indexedScreenIds].sort()),
    'visible screen/state IDs must exactly match the JSON index',
  );
  check(
    JSON.stringify([...visibleCapabilityIds].sort()) === JSON.stringify([...indexedCapabilityIds].sort()),
    'visible capability IDs must exactly match the JSON index',
  );
  check(productIndex.screens.every((screen) => screen.status === 'shipped'), 'every indexed current screen must be shipped');
  check(productIndex.capabilities.every((capability) => capability.status === 'shipped'), 'every indexed current capability must be shipped');
}

if (!htmlOnly) {
  const [map, baseline, verification] = await Promise.all([
    json('packages/design-system/figma-map.json'),
    json('docs/product/figma/archive-baseline-2026-07-21.json'),
    json('docs/product/figma/last-verification.json'),
  ]);
  const allowedStatuses = new Set(['shipped', 'approved-not-shipped', 'exploring', 'rejected', 'archived']);
  const allowedLifecycles = new Set(['maintained', 'experiment', 'next', 'archived']);
  const allowedPageIds = new Set(map.pages.map((page) => page.id));
  const mappingIds = map.mappings.map((mapping) => mapping.id);
  const nodeIds = map.mappings.map((mapping) => mapping.figma.nodeId);
  check(duplicates(mappingIds).length === 0, `duplicate figma-map IDs: ${duplicates(mappingIds).join(', ')}`);
  check(duplicates(nodeIds).length === 0, `duplicate maintained Figma node IDs: ${duplicates(nodeIds).join(', ')}`);
  check(map.mappings.every((mapping) => allowedStatuses.has(mapping.status)), 'figma-map contains an unsupported status');
  check(map.mappings.every((mapping) => allowedLifecycles.has(mapping.lifecycleStatus)), 'figma-map contains an unsupported lifecycle status');
  check(map.mappings.every((mapping) => allowedPageIds.has(mapping.figma.pageId)), 'figma-map node targets a non-allowlisted new page');
  check(map.mappings.every((mapping) => !baseline.protectedPageIds.includes(mapping.figma.pageId)), 'figma-map node targets a protected archive page');
  check(map.mappings.every((mapping) => mapping.figma.fileKey === map.fileKey), 'figma-map file keys disagree');

  for (const mapping of map.mappings) {
    check(await exists(mapping.sourcePath), `missing source path for ${mapping.id}: ${mapping.sourcePath}`);
    const [specFile, anchor] = mapping.specPath.split('#');
    check(await exists(specFile), `missing spec path for ${mapping.id}: ${specFile}`);
    if (anchor) check(html.includes(`id="${anchor}"`), `missing HTML spec anchor for ${mapping.id}: #${anchor}`);
  }

  const expectedPages = [
    ['6:2', '01 Raw Imports', 0],
    ['8:232', '02 Design System', 1],
    ['8:233', '03 Screens', 2],
    ['1956:2', '04 Marketing Website', 3],
    ['1967:69', '05 Screenshots', 4],
  ];
  check(baseline.pages.length === 5, 'archive baseline must contain exactly five protected pages');
  for (const [id, name, order] of expectedPages) {
    const page = baseline.pages[order];
    check(page?.id === id && page?.name === name && page?.order === order, `protected page ${order + 1} changed in the baseline manifest`);
    check(duplicates(page?.topLevelChildren?.map((node) => node.id) ?? []).length === 0, `duplicate protected top-level node ID on ${name}`);
  }
  check(duplicates(baseline.components.map((component) => component.id)).length === 0, 'duplicate protected component IDs in baseline');
  check(duplicates(baseline.variableCollections.map((collection) => collection.id)).length === 0, 'duplicate variable collection IDs in baseline');
  check(duplicates(baseline.styles.map((style) => style.id)).length === 0, 'duplicate style IDs in baseline');
  check(verification.allChecksPassed === true, 'last Figma verification did not pass');
  check(verification.protectedPages.every((page) => page.ok), 'a protected page failed the last Figma verification');

  for (const pngPath of [
    'docs/product/chatgpt/fieldsolo-core-screens.png',
    'docs/product/chatgpt/fieldsolo-states-and-overlays.png',
  ]) {
    check(await exists(pngPath), `missing ChatGPT atlas: ${pngPath}`);
    if (await exists(pngPath)) {
      const bytes = await readFile(path.join(root, pngPath));
      check(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${pngPath} is not a PNG`);
    }
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(htmlOnly ? 'Product HTML validation passed.' : 'Design and product-context validation passed.');
