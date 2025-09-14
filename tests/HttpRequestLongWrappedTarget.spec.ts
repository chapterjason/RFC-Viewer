import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('HttpRequestMatcher long wrapped request-target (bug9)', () => {
    it('parses a GET with HTTP token appearing deeper in wrapped lines', () => {
        // Mirrors docs/bug9.md shape: method line indented 3, several wrapped lines,
        // HTTP/1.1 appears only on the 4th wrapped line, then a header line.
        const lines = [
            '',
            '   GET /authorize?response_type=token&state=9ad67f13',
            '       &client_id=s6BhdRkqt3',
            '       &redirect_uri=https%3A%2F%2Fclient.somesite.example',
            '        %2Fcb%26redirect_to%253Dhttps%253A%252F',
            '        %252Fattacker.example%252F HTTP/1.1',
            '   Host: server.somesite.example',
            '',
        ];

        const doc = parse(new ArrayCursor(lines));

        // Expect the request to be captured as a single HttpRequest node between blanks
        expect(doc.children.map((n: any) => n.type)).toEqual([
            'BlankLine',
            'HttpRequest',
            'BlankLine',
        ]);

        const req: any = doc.children[1];
        expect(req.type).toBe('HttpRequest');
        // Should include method line, all wrapped lines, and the Host header
        expect(req.lines.length).toBe(6);
        expect(req.lines[0]).toMatch(/GET\s+\/authorize\?response_type=token/);
        expect(req.lines.some((l: string) => /HTTP\/[0-9]/.test(l))).toBe(true);
        expect(req.lines[req.lines.length - 1]).toMatch(/\bHost:\s*server\.somesite\.example$/);
    });
});

