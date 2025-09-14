import {describe, it, expect} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('ABNF vs DefinitionList precedence', () => {
  it('parses an ABNF rule (b64token) as Abnf, not DefinitionList', () => {
    // Arrange: RFC-style ABNF rule with continuation
    const lines = [
      '     b64token    = 1*( ALPHA / DIGIT /',
      '                         "-" / "." / "_" / "~" / "+" / "/" ) *"="',
      '',
    ].join('\n').replace(/\r?\n/g, '\n').split('\n');

    const cursor = new ArrayCursor(lines);

    // Act
    const document = parse(cursor);
    const kinds = document.children.map(n => n.type);

    // Assert: recognized as Abnf block
    expect(kinds[0]).toBe('Abnf');
    const abnf = document.children[0] as any;
    expect(abnf.lines).toEqual([
      '     b64token    = 1*( ALPHA / DIGIT /',
      '                         "-" / "." / "_" / "~" / "+" / "/" ) *"="',
    ]);
  });
});

