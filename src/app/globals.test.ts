import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('dark mode configuration', () => {
  it('keeps class-based dark variant defined before tailwind import', () => {
    const globalsPath = path.resolve(__dirname, 'globals.css');
    const css = readFileSync(globalsPath, 'utf8');

    const variantLine = '@custom-variant dark (&:is(.dark *));';
    const variantIndex = css.indexOf(variantLine);
    const importIndex = css.indexOf('@import "tailwindcss";');

    expect(variantIndex).toBeGreaterThan(-1);
    expect(importIndex).toBeGreaterThan(-1);
    expect(variantIndex).toBeLessThan(importIndex);
  });
});
