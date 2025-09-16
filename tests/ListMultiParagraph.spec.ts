import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';
import {renderList} from '../src/Tree/Render/RenderList.js';
import type {ListItemNode} from '../src/Tree/Node/ListItemNode.js';
import type {ParagraphNode} from '../src/Tree/Node/ParagraphNode.js';

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
        const item = list.items.find((entry: any) => entry.type === 'ListItem') as ListItemNode;
        expect(item).toBeDefined();
        const blankLines = item.children.filter((child) => child.type === 'BlankLine');
        expect(blankLines).toHaveLength(1);
        const paragraphs = item.children.filter((child): child is ParagraphNode => child.type === 'Paragraph');
        expect(paragraphs).toHaveLength(2);
        expect(paragraphs[1].lines.join(' ')).toContain('web attackers may operate OAuth clients');
        // No separate IndentedBlock node should appear
        expect(doc.children.length).toBe(1);

        // Round trip renders the same lines
        expect(renderList(list)).toEqual(lines);
    });
});
