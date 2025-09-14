import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('HttpResponseMatcher with body', () => {
    it('parses indented HTTP response headers followed by blank line and indented body as a single HttpResponse node', () => {
        // Arrange: surrounding paragraph context, then headers block, blank, body block, then paragraph
        const lines = [
            '   Preface text about the upcoming response example.',
            '',
            '    HTTP/1.1 200 OK',
            '    Content-Type: application/json;charset=UTF-8',
            '    Cache-Control: no-store',
            '    Pragma: no-cache',
            '',
            '    {',
            '      "access_token":"2YotnFZFEjr1zCsicMWpAA",',
            '      "token_type":"example",',
            '      "expires_in":3600,',
            '      "refresh_token":"tGzv3JOkF0XG5Qx2TlKWIA",',
            '      "example_parameter":"example_value"',
            '    }',
            '',
            '   Postface explanation follows after the response example.'
        ];

        // Act
        const doc = parse(new ArrayCursor(lines));

        // Assert: node kinds around the response
        const kinds = doc.children.map((n: any) => n.type);
        expect(kinds).toEqual([
            'Paragraph',
            'BlankLine',
            'HttpResponse',
            'BlankLine',
            'Paragraph',
        ]);

        // Locate the HttpResponse node (index 2)
        const node: any = doc.children[2];
        expect(node.type).toBe('HttpResponse');
        expect(typeof node.statusLine).toBe('string');
        expect(node.statusLine).toMatch(/HTTP\/1\.[01]\s+200\s+OK/);
        expect(Array.isArray(node.headerLines)).toBe(true);
        expect(node.headerLines.some((s: string) => /Content-Type:\s*application\/json/i.test(s))).toBe(true);
        expect(node.bodyLines && node.bodyLines.length).toBeGreaterThan(0);
        expect(node.bodyLines![0].trim()).toBe('{');
        expect(node.bodyLines![node.bodyLines!.length - 1].trim()).toBe('}');
    });
});
