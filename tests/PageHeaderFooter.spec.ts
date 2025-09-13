import {describe, expect, it} from 'vitest';
import {parse} from '../src/Tree/Parser.js';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';

describe('PageHeader and PageFooter integration', () => {
    it('parses footer, break, and header in order', () => {
        // Arrange
        const lines = [
            '   Some content before the footer.',
            'Footer line before page break',
            '\f',
            'RFC 9999  Example Header                       January 2099',
            '',
            '   Body content after header.',
        ];

        // Act
        const actual = parse(new ArrayCursor(lines));

        // Assert
        const kinds = actual.children.map((node: any) => node.type);
        expect(kinds).toEqual([
            'Paragraph',
            'PageFooter',
            'PageBreak',
            'PageHeader',
            'BlankLine',
            'Paragraph',
        ]);
    });
});

