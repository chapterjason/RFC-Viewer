import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('ListMatcher definition heuristics - avoid false positives', () => {
    it('does not treat window.opener.postMessage call as a definition list', () => {
        // Arrange: RFC-like paragraph with a multi-line function call
        const snippetWithContext = [
            '',
            '   window.opener.postMessage(',
            '     {',
            '       code: "ABC",',
            '       state: "123"',
            '     },',
            '     "https://attacker.example" // attacker-provided value',
            '   )',
            '',
        ];

        // Act
        const document = parse(new ArrayCursor(snippetWithContext));
        const kinds = document.children.map((n: any) => n.type);

        // Assert: parsed as BlankLine, Paragraph, IndentedBlock, Paragraph, BlankLine without creating a list
        expect(kinds).toEqual(['BlankLine', 'Paragraph', 'IndentedBlock', 'Paragraph', 'BlankLine']);

        // Additional sanity checks on node contents
        const firstParagraph: any = document.children[1];
        expect(firstParagraph.type).toBe('Paragraph');
        expect(firstParagraph.indent).toBe(3);
        expect(firstParagraph.lines).toEqual(['window.opener.postMessage(']);

        const block: any = document.children[2];
        expect(block.type).toBe('IndentedBlock');
        expect(block.indent).toBe(4);
        expect(block.lines[0]).toBe(' {');

        const closingParagraph: any = document.children[3];
        expect(closingParagraph.type).toBe('Paragraph');
        expect(closingParagraph.indent).toBe(3);
        expect(closingParagraph.lines).toEqual([')']);
    });
});
