import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('HttpResponseMatcher continuation lines', () => {
    it('includes wrapped header continuation lines within the HttpResponse block', () => {
        // Arrange: narrative before and after, with an indented response whose Location header wraps
        const lines = [
            'Intro before example.',
            '',
            '     HTTP/1.1 302 Found',
            '     Location: https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA',
            '               &state=xyz',
            '',
            'Outro after example.',
        ];

        // Act: parse the document
        const document = parse(new ArrayCursor(lines));

        // Assert: node kinds should include a single HttpResponse, not an extra IndentedBlock
        const actualKinds = document.children.map((node: any) => node.type);
        expect(actualKinds).toEqual([
            'SectionTitle',
            'BlankLine',
            'HttpResponse',
            'BlankLine',
            'SectionTitle',
        ]);

        // Assert: the HttpResponse node includes the wrapped continuation line
        const node: any = document.children[2];
        expect(node.type).toBe('HttpResponse');
        expect(node.lines.length).toBe(3);
        expect(node.lines[0].trim()).toMatch(/^HTTP\/\d(?:\.\d)?\s+302\b/);
        expect(node.lines[1]).toMatch(/^\s+Location:/);
        expect(node.lines[2].trim().startsWith('&state=xyz')).toBe(true);
    });
});

