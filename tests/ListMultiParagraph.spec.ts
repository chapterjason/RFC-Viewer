import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('List items with multiple paragraphs', () => {
    it('keeps indented paragraph after a blank line inside the same item', () => {
        // Arrange: RFC-style list with an (A1) marker, a wrapped first paragraph,
        // then a blank line, then a second paragraph at the same content indent.
        const lines = [
            '   (A1)  Web attackers that can set up and operate an arbitrary number',
            '          of network endpoints (besides the "honest" ones) including',
            '          browsers and servers.  Web attackers may set up websites that',
            '          are visited by the resource owner, operate their own user',
            '          agents, and participate in the protocol.',
            '',
            '          In particular, web attackers may operate OAuth clients that are',
            '          registered at the authorization server, and they may operate',
            '          their own authorization and resource servers that can be used',
            '          (in parallel to the "honest" ones) by the resource owner and',
            '          other resource owners.',
        ];

        // Act
        const doc = parse(new ArrayCursor(lines));
        const list = doc.children[0] as any;

        // Assert
        expect(list.type).toBe('List');
        expect(list.items.length).toBe(1);
        const item = list.items[0];
        // We expect an empty string separating paragraphs inside the item
        expect(item.lines.some((l: string) => l === '')).toBe(true);
        // Ensure the second paragraph lines are included after the blank separator
        const joined = item.lines.join('\n');
        expect(joined).toContain('In particular, web attackers may operate OAuth clients');
        // No separate IndentedBlock node should appear
        expect(doc.children.length).toBe(1);
    });
});

