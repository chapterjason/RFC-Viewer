import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('TableOfContentsMatcher (RFC 9700 style)', () => {
    it('parses ToC without dot leaders following a Table of Contents heading', () => {
        // Arrange: snippet modeled after RFC 9700 ToC (no leaders)
        const snippet = [
            'Table of Contents',
            '',
            '   1.  Introduction',
            '     1.1.  Structure',
            '     1.2.  Conventions and Terminology',
            '   2.  Best Practices',
            '     2.1.  Protecting Redirect-Based Flows',
            '       2.1.1.  Authorization Code Grant',
            '       2.1.2.  Implicit Grant',
        ];

        // Act
        const doc = parse(new ArrayCursor(snippet));
        const kinds = doc.children.map((n: any) => n.type);

        // Assert: SectionTitle, BlankLine, then a single TableOfContents node
        expect(kinds.slice(0, 3)).toEqual(['SectionTitle', 'BlankLine', 'TableOfContents']);
        const toc: any = doc.children[2];
        expect(toc.type).toBe('TableOfContents');
        // Ensure multiple entries captured and no List/IndentedBlock misclassification
        expect(toc.lines.length).toBeGreaterThanOrEqual(6);
        expect(kinds).not.toContain('List');
        expect(kinds).not.toContain('IndentedBlock');
    });
});

