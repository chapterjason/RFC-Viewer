import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('HttpRequestMatcher avoids HTTP token inside narrative paragraph', () => {
    it('does not misparse a paragraph mentioning HTTP/1.1 as HttpRequest', () => {
        // Arrange: narrative paragraph lines (exactly 3-space indent) with a later line
        // mentioning HTTP/1.1; followed by a blank and another paragraph. This mirrors
        // the mis-detected case reported by the user.
        const lines = [
            '',
            '   A "realm" attribute MAY be included to indicate the scope of',
            '   protection in the manner described in HTTP/1.1 [RFC2617].  The',
            '   "realm" attribute MUST NOT appear more than once.',
            '',
            '   The "scope" attribute is defined in Section 3.3 of [RFC6749].  The',
            '   "scope" attribute is a space-delimited list of case-sensitive scope',
            '   values indicating the required scope of the access token for',
            '   accessing the requested resource. "scope" values are implementation',
            '   defined; there is no centralized registry for them; allowed values',
            '   are defined by the authorization server.  The order of "scope" values',
            '   is not significant.  In some cases, the "scope" value will be used',
            '',
        ];

        // Act
        const document = parse(new ArrayCursor(lines));

        // Assert: paragraphs separated by blank lines; no HttpRequest nodes present
        const kinds = document.children.map((n: any) => n.type);
        expect(kinds).toEqual([
            'BlankLine',
            'Paragraph',
            'BlankLine',
            'Paragraph',
            'BlankLine',
        ]);
        expect(kinds.includes('HttpRequest')).toBe(false);
    });
});

