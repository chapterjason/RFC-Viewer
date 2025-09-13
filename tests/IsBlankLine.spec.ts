import { describe, it, expect } from 'vitest';
import { isBlankLine } from '../src/Utils/IsBlankLine.js';

describe('isBlankLine', () => {
  it('returns true for empty or whitespace-only lines', () => {
    expect(isBlankLine('')).toBe(true);
    expect(isBlankLine('   ')).toBe(true);
    expect(isBlankLine('\t')).toBe(true);
  });

  it('returns false for non-null non-blank content', () => {
    expect(isBlankLine('a')).toBe(false);
    expect(isBlankLine(' text')).toBe(false);
  });

  it('returns false for null input', () => {
    expect(isBlankLine(null)).toBe(false);
  });
});

