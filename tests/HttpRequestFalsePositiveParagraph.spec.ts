import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('HttpRequestMatcher false positive avoidance', () => {
    it('does not misparse an indented narrative paragraph as HttpRequest', () => {
        // Arrange: sample from docs/bug8.md — narrative lines with a colon later
        const lines = [
            '',
            '   PKCE not only protects against the authorization code injection',
            '   attack but also protects authorization codes created for public',
            '   clients: PKCE ensures that an attacker cannot redeem a stolen',
            '   authorization code at the token endpoint of the authorization server',
            '   without knowledge of the code_verifier.',
            '',
        ];

        // Act
        const doc = parse(new ArrayCursor(lines));

        // Assert: treated as BlankLine, Paragraph, BlankLine — no HttpRequest
        const kinds = doc.children.map((n: any) => n.type);
        expect(kinds).toEqual([
            'BlankLine',
            'Paragraph',
            'BlankLine',
        ]);
    });
});

