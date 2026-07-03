import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';

import {
  REQUIRED_PRIVACY_VERSION,
  REQUIRED_TERMS_VERSION,
} from './legal-versions';

const privacyMarkdown = readFileSync(
  path.resolve(__dirname, '../../../../docs/legal/privacy-policy.md'),
  'utf8',
);
const termsMarkdown = readFileSync(
  path.resolve(__dirname, '../../../../docs/legal/terms.md'),
  'utf8',
);

describe('legal document versions', () => {
  it('matches the canonical privacy policy version', () => {
    const markdownVersion = privacyMarkdown.match(/\*\*Policy version:\*\* ([\d-]+)/)?.[1];
    expect(REQUIRED_PRIVACY_VERSION).toBe(markdownVersion);
  });

  it('matches the canonical terms version', () => {
    const markdownVersion = termsMarkdown.match(/\*\*Terms version:\*\* ([\d-]+)/)?.[1];
    expect(REQUIRED_TERMS_VERSION).toBe(markdownVersion);
  });
});
