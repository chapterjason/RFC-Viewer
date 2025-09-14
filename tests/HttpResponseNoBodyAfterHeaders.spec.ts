import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('HttpResponseMatcher without body-indicative headers', () => {
    it('does not swallow following indented narrative as response body', () => {
        const lines = [
            '    HTTP/1.1 302 Found',
            '    Location: https://example.com/next',
            '',
            '   The client is redirected to the next resource as indicated',
            '   by the Location header.',
        ];

        const doc = parse(new ArrayCursor(lines));
        const kinds = doc.children.map((n: any) => n.type);
        expect(kinds).toEqual([
            'HttpResponse',
            'BlankLine',
            'Paragraph',
        ]);

        const res: any = doc.children[0];
        expect(res.type).toBe('HttpResponse');
        expect(res.bodyLines).toBeUndefined();
    });
});

