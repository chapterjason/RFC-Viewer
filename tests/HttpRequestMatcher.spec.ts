import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('HttpRequestMatcher', () => {
    it('parses an indented HTTP request with wrapped request-target and a header', () => {
        // Arrange: narrative before, then an RFC-like GET request, then narrative
        const lines = [
            'Some introduction before the request example.',
            '',
            '    GET /authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz',
            '        &redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb HTTP/1.1',
            '    Host: server.example.com',
            '',
            'More narrative after the example.',
        ];

        // Act
        const document = parse(new ArrayCursor(lines));

        // Assert: node kinds and order
        const kinds = document.children.map((n: any) => n.type);
        expect(kinds).toEqual([
            'SectionTitle',
            'BlankLine',
            'HttpRequest',
            'BlankLine',
            'SectionTitle',
        ]);

        // Assert: HttpRequest node contains the start/request lines and header lines
        const node: any = document.children[2];
        expect(node.type).toBe('HttpRequest');
        expect(node.lines.length).toBe(3);
        expect(node.lines[0]).toMatch(/^\s{4}GET\s+\/authorize\?response_type=code/);
        expect(node.lines[1]).toMatch(/^\s{8}&redirect_uri=.*HTTP\/[0-9]/);
        expect(node.lines[2]).toMatch(/^\s{4}Host:/);
    });

    it('supports many HTTP methods and requires evidence (HTTP token or header)', () => {
        // Arrange: a non-header narrative line that looks like a METHOD should not match
        const narrative = ['PATCH operations are described in detail.'];
        const doc1 = parse(new ArrayCursor(narrative));
        expect(doc1.children.map((n: any) => n.type)).toEqual(['SectionTitle']);

        // Arrange: explicit methods
        const methods = ['GET','POST','PUT','DELETE','PATCH','HEAD','OPTIONS','CONNECT','TRACE','PROPFIND','MKCOL'];
        for (const m of methods) {
            const req = [
                `   ${m} /sample HTTP/1.1`,
                '   Host: example.test',
            ];
            const doc = parse(new ArrayCursor(req));
            expect(doc.children.map((n: any) => n.type)).toEqual(['HttpRequest']);
        }
    });
});
