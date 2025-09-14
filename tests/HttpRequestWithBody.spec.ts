import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('HttpRequestMatcher with body', () => {
    it('parses headers followed by blank line and indented body into bodyLines', () => {
        // Arrange: POST with headers, blank, and JSON body
        const lines = [
            '   Introduction paragraph for request with body.',
            '',
            '    POST /token HTTP/1.1',
            '    Host: server.example.com',
            '    Content-Type: application/x-www-form-urlencoded',
            '',
            '    grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA',
            '    &redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb',
            '',
            '   Tail paragraph after example.'
        ];

        // Act
        const doc = parse(new ArrayCursor(lines));

        // Assert around the request
        const kinds = doc.children.map((n: any) => n.type);
        expect(kinds).toEqual([
            'Paragraph',
            'BlankLine',
            'HttpRequest',
            'BlankLine',
            'Paragraph',
        ]);

        const node: any = doc.children[2];
        expect(node.type).toBe('HttpRequest');
        expect(node.requestLines.some((s: string) => /POST\s+\/token/.test(s))).toBe(true);
        expect(node.headerLines.some((s: string) => /Content-Type:\s*application\/x-www-form-urlencoded/i.test(s))).toBe(true);
        expect(node.bodyLines && node.bodyLines.length).toBeGreaterThan(0);
        expect(node.bodyLines![0].trim()).toMatch(/^grant_type=/);
    });
});
