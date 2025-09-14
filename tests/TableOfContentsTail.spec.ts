import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('TableOfContentsMatcher (RFC 9700 tail entries)', () => {
    it('includes unnumbered tail entries like Acknowledgements', () => {
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
            '   Acknowledgements',
            "   Authors' Addresses",
            '',
        ];

        const doc = parse(new ArrayCursor(snippet));
        const toc: any = doc.children.find((n: any) => n.type === 'TableOfContents');
        expect(toc).toBeTruthy();
        // Ensure the final two unnumbered entries are included
        const titles = toc.entries.map((e: any) => e.title);
        expect(titles).toContain('Acknowledgements');
        expect(titles).toContain("Authors' Addresses");
        // Ensure they are represented in lines as well
        expect(toc.lines).toContain('   Acknowledgements');
        expect(toc.lines).toContain("   Authors' Addresses");
    });
});
