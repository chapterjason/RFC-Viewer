import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('TableOfContentsMatcher', () => {
    it('parses wrapped ToC entries where leaders appear on continuation line', () => {
        // Arrange: snippet with wrapped title and leaders on next line
        const snippetWithContext = [
            '      10.13. Clickjacking ............................................60',
            '      10.14. Code Injection and Input Validation .....................60',
            '      10.15. Open Redirectors ........................................60',
            '      10.16. Misuse of Access Token to Impersonate Resource',
            '             Owner in Implicit Flow ..................................61',
            '   11. IANA Considerations ...........................................62',
            '      11.1. OAuth Access Token Types Registry ........................62',
        ];

        // Act
        const doc = parse(new ArrayCursor(snippetWithContext));
        const kinds = doc.children.map((n: any) => n.type);

        // Assert: single ToC block detected, not an IndentedBlock
        expect(kinds).toEqual(['TableOfContents']);
        const toc: any = doc.children[0];
        expect(toc.type).toBe('TableOfContents');
        expect(toc.lines.length).toBe(7);
        // Ensure wrapped lines are preserved in order
        expect(toc.lines[3]).toMatch(/Misuse of Access Token/);
        expect(toc.lines[4]).toMatch(/Implicit Flow/);
    });
});

