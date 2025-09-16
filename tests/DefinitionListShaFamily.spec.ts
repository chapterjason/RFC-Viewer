import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';
import type {ListNode} from '../src/Tree/Node/ListNode.js';
import type {ListItemNode} from '../src/Tree/Node/ListItemNode.js';
import type {ParagraphNode} from '../src/Tree/Node/ParagraphNode.js';

function listItems(node: ListNode): ListItemNode[] {
    return node.items.filter((entry): entry is ListItemNode => entry.type === 'ListItem');
}

function paragraphText(item: ListItemNode): string {
    return item.children
        .filter((child): child is ParagraphNode => child.type === 'Paragraph')
        .map((paragraph) => paragraph.lines.join(' '))
        .join(' ');
}

describe('ListMatcher - SHA family mixed inline and wrapped terms', () => {
    it('parses inline and wrapped definition items without falling back to Paragraph', () => {
        // Arrange: SHA entries mixing inline single-line items and wrapped descriptions
        const lines = [
            '   SHA           Secure Hash Algorithm',
            '',
            '   SHA-1         Secure Hash Algorithm 1 (with message digest of 160',
            '                 bits)',
            '',
            '   SHA-3         Secure Hash Algorithm 3 (arbitrary size)',
            '',
            '   SHA-224       Secure Hash Algorithm 2 with message digest size of 224',
            '                 bits',
            '',
            '   SHA-256       Secure Hash Algorithm 2 with message digest size of 256',
            '                 bits',
            '',
            '   SHA-512       Secure Hash Algorithm 2 with message digest size of 512',
            '                 bits',
            '',
            '   SHAKE         Secure Hash Algorithm 3 based on the KECCAK algorithm',
        ];

        // Act
        const document = parse(new ArrayCursor(lines));
        const kinds = document.children.map((node: any) => node.type);

        // Assert: single List node with interleaved blank lines preserved
        expect(kinds).toEqual(['List']);

        const list = document.children[0] as ListNode;
        const itemTypes = list.items.map((entry: any) => entry.type);
        expect(itemTypes).toEqual([
            'ListItem', 'BlankLine',
            'ListItem', 'BlankLine',
            'ListItem', 'BlankLine',
            'ListItem', 'BlankLine',
            'ListItem', 'BlankLine',
            'ListItem', 'BlankLine',
            'ListItem',
        ]);

        const entries = listItems(list);
        expect(entries[0].inline).toBe(true);
        expect(paragraphText(entries[0])).toContain('Secure Hash Algorithm');

        expect(entries[2].inline).toBe(true);
        expect(paragraphText(entries[2])).toContain('Secure Hash Algorithm 3');

        expect(entries[6].inline).toBe(true);
        expect(paragraphText(entries[6])).toContain('KECCAK');

        expect(paragraphText(entries[1])).toContain('bits)');
        expect(paragraphText(entries[3])).toContain('bits');
        expect(paragraphText(entries[4])).toContain('bits');
        expect(paragraphText(entries[5])).toContain('bits');
    });
});
