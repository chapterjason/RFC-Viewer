import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('Bracketed marker with single space is not a list', () => {
    it('treats "[RFCXXXX] text" with one space as paragraph content', () => {
        // Arrange: RFC-like snippet where a bracketed token is followed by a single space
        const snippet = [
            '   Prior paragraph text.',
            '',
            '   [RFC6749] already provides robust baseline protection by requiring',
            '',
            '   *  confidentiality of the refresh tokens in transit and storage,',
        ];

        // Act
        const document = parse(new ArrayCursor(snippet));
        const kinds = document.children.map(n => n.type);

        // Assert: a Paragraph, BlankLine, Paragraph, BlankLine, then List (for the star item)
        expect(kinds).toEqual(['Paragraph', 'BlankLine', 'Paragraph', 'BlankLine', 'List']);
    });
});
