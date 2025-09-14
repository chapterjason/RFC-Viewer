import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('HttpRequestMatcher GET without explicit body headers', () => {
    it('does not swallow following indented narrative as request body', () => {
        const lines = [
            '   GET /authorize?response_type=code&client_id=s6BhdRkqt3 HTTP/1.1',
            '   Host: server.somesite.example',
            '',
            '   The authorization server validates the redirection URI and compares',
            '   it to the registered redirection URL patterns for the client',
            '   s6BhdRkqt3.  The authorization request is processed and presented to',
            '   the user.',
        ];

        const doc = parse(new ArrayCursor(lines));

        const kinds = doc.children.map((n: any) => n.type);
        expect(kinds).toEqual([
            'HttpRequest',
            'BlankLine',
            'Paragraph',
        ]);

        const req: any = doc.children[0];
        expect(req.type).toBe('HttpRequest');
        expect(req.bodyLines).toBeUndefined();
    });
});

