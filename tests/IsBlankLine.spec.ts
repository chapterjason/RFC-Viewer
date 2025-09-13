import { describe, it, expect } from 'vitest';
import { isBlankLine } from '../src/Utils/IsBlankLine.js';

describe('isBlankLine', () => {
  it('returns true for empty or whitespace-only lines', () => {
    // Arrange: inputs to classify as blank
    const inputs = ['', '   ', '\t'];
    for (const input of inputs) {
      // Act
      const actualValue = isBlankLine(input);
      // Assert
      expect(actualValue).toBe(true);
    }
  });

  it('returns false for non-null non-blank content', () => {
    // Arrange: inputs to classify as non-blank
    const inputs = ['a', ' text'];
    for (const input of inputs) {
      // Act
      const actualValue = isBlankLine(input);
      // Assert
      expect(actualValue).toBe(false);
    }
  });

  it('returns false for null input', () => {
    // Act
    const actualValue = isBlankLine(null);
    // Assert
    expect(actualValue).toBe(false);
  });
});
