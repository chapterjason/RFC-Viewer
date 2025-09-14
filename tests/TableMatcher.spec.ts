import {describe, expect, it} from 'vitest';
import type {BlockContext} from '../src/Tree/BlockContext.js';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {TableMatcher} from '../src/Tree/Matcher/TableMatcher.js';
import {parse} from '../src/Tree/Parser.js';

function createTestContext(lines: string[]): BlockContext {
    const cursor = new ArrayCursor(lines);
    return {
        cursor,
        peek: (offset: number) => cursor.peek(offset),
        advance: () => cursor.next(),
        state: {seenMetadata: false, seenTitle: false},
    };
}

describe('TableMatcher', () => {
    it('detects and parses an RFC-style ASCII table with caption', () => {
        // Arrange: minimal table block and caption at indent >= 4
        const lines = [
            '    +======+======+',
            '    | H1   | H2   |',
            '    +======+======+',
            '    | a    | b    |',
            '    +------+------+',
            '',
            '    Table 1: Heading',
        ];
        const context = createTestContext(lines);

        // Act
        const canMatch = TableMatcher.test(context);
        const node = TableMatcher.parse(context) as any;

        // Assert
        expect(canMatch).toBe(true);
        expect(node.type).toBe('Table');
        expect(node.indent).toBe(4);
        // Lines trimmed by indent, preserving internal blank line and caption
        expect(node.lines[0].startsWith('+======+')).toBe(true);
        expect(node.lines[node.lines.length - 1]).toBe('Table 1: Heading');
        // Should have blank line preserved before caption
        const hasBlank = node.lines.some((l: string) => l === '');
        expect(hasBlank).toBe(true);
    });

    it('integrates in the parser between paragraphs as a single Table node', () => {
        // Arrange: sample from the prompt (shortened for test while preserving structure)
        const snippet = [
            '   Table 1 lists the contents of the variant field, where the letter "x"',
            '   indicates a "don\'t-care" value.',
            '',
            '     +======+======+======+======+=========+=========================+',
            '     | MSB0 | MSB1 | MSB2 | MSB3 | Variant | Description             |',
            '     +======+======+======+======+=========+=========================+',
            '     | 0    | x    | x    | x    | 1-7     | Reserved.  Network      |',
            '     +------+------+-',
            '',
            '                        Table 1: UUID Variants',
            '',
            '   Interoperability, in any form, with variants other than the one',
            '   defined here is not guaranteed but is not likely to be an issue in',
            '   practice.',
        ];

        // Act
        const doc = parse(new ArrayCursor(snippet));
        const kinds = doc.children.map((n: any) => n.type);

        // Assert: Paragraph, BlankLine, Table, BlankLine, Paragraph
        expect(kinds).toEqual(['Paragraph', 'BlankLine', 'Table', 'BlankLine', 'Paragraph']);
        const tbl: any = doc.children[2];
        expect(tbl.type).toBe('Table');
        // Rendered lines should include the caption text at the end (after a blank)
        const joined = tbl.lines.join('\n');
        expect(joined).toMatch(/Table\s+1:\s+UUID Variants/);
    });
});

