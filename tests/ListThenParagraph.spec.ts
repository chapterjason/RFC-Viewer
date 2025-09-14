import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('List followed by narrative paragraph', () => {
    it('does not include a 3-space paragraph after a blank line in the last list item', () => {
        // Arrange: three star bullets, then a blank line, then a 3-space-indented paragraph
        const lines = [
            '   *  Public clients MUST use PKCE [RFC7636] to this end, as motivated',
            '      in Section 4.5.3.1.',
            '   *  For confidential clients, the use of PKCE [RFC7636] is',
            '      RECOMMENDED, as it provides strong protection against misuse and',
            '      injection of authorization codes as described in Section 4.5.3.1.',
            '      Also, as a side effect, it prevents CSRF even in the presence of',
            '      strong attackers as described in Section 4.7.1.',
            '   *  With additional precautions, described in Section 4.5.3.2,',
            '      confidential OpenID Connect [OpenID.Core] clients MAY use the',
            '      nonce parameter and the respective Claim in the ID Token instead.',
            '',
            '   In any case, the PKCE challenge or OpenID Connect nonce MUST be',
            '   transaction-specific and securely bound to the client and the user',
            '   agent in which the transaction was started.',
        ];

        // Act
        const doc = parse(new ArrayCursor(lines));

        // Assert: nodes should be List, BlankLine, Paragraph
        const kinds = doc.children.map((n: any) => n.type);
        expect(kinds).toEqual(['List', 'BlankLine', 'Paragraph']);

        // Assert: the last list item should not contain the narrative paragraph
        const list: any = doc.children[0];
        expect(list.items.length).toBe(3);
        const lastItem = list.items[2];
        const lastItemText = lastItem.lines.join('\n');
        expect(lastItemText).not.toContain('In any case, the PKCE challenge');

        // Assert: the paragraph node starts with three spaces preserved
        const para: any = doc.children[2];
        expect(para.lines[0].startsWith('   In any case')).toBe(true);
    });
});

