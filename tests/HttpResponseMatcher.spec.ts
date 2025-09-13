import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('HttpResponseMatcher', () => {
    it('parses a small indented HTTP response paragraph with surrounding context', () => {
        // Arrange: context lines before and after, with a blank line separating
        const snippetWithContext = [
            'Some introduction before the response example.',
            '',
            '   HTTP/1.1 302 Found',
            '   Location: https://client.example.com/cb?error=access_denied&state=xyz',
            '',
            'More narrative after the example.',
        ];

        // Act: parse the document
        const document = parse(new ArrayCursor(snippetWithContext));

        // Assert: node kinds and order
        const actualKinds = document.children.map((node: any) => node.type);
        const expectedKinds = [
            'SectionTitle',
            'BlankLine',
            'HttpResponse',
            'BlankLine',
            'SectionTitle',
        ];
        expect(actualKinds).toEqual(expectedKinds);

        // Assert: the HttpResponse node contains exactly the status + header lines
        const node: any = document.children[2];
        expect(node.type).toBe('HttpResponse');
        expect(node.lines.length).toBe(2);
        expect(node.lines[0]).toBe('   HTTP/1.1 302 Found');
        expect(node.lines[1]).toMatch(/^\s{3}Location:/);
    });

    it('does not misclassify narrative mentioning HTTP unless followed by headers', () => {
        // Arrange: looks like a status line but no header line after
        const snippet = [
            'HTTP/1.1 200 OK is an example status code mentioned in text.'
        ];

        // Act
        const document = parse(new ArrayCursor(snippet));

        // Assert: remains a SectionTitle (column 0 narrative is treated as section title here)
        const kinds = document.children.map((n: any) => n.type);
        expect(kinds).toEqual(['SectionTitle']);
    });
});
