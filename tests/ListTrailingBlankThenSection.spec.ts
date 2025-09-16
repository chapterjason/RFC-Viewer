import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';
import {renderList} from '../src/Tree/Render/RenderList.js';
import type {ListItemNode} from '../src/Tree/Node/ListItemNode.js';

describe('List followed by blank line then section title', () => {
    it('does not swallow the trailing blank line into the list item', () => {
        // Arrange: a list item with wrapped lines, then a blank line, then a section title
        const lines = [
            '   *  Technology has changed.  For example, the way browsers treat',
            '      fragments when redirecting requests has changed, and with it, the',
            '      implicit grant\'s underlying security model.',
            '',
            '1.1.  Structure',
        ];

        // Act
        const doc = parse(new ArrayCursor(lines));

        // Assert: nodes should be List, BlankLine, SectionTitle
        const kinds = doc.children.map((n: any) => n.type);
        expect(kinds).toEqual(['List', 'BlankLine', 'SectionTitle']);

        // Assert: the list item should not contain an empty string from the trailing blank line
        const list: any = doc.children[0];
        expect(list.type).toBe('List');
        const item = list.items.find((entry: any) => entry.type === 'ListItem') as ListItemNode;
        expect(item).toBeDefined();
        const lastChild = item.children[item.children.length - 1];
        expect(lastChild.type).toBe('Paragraph');

        // Round trip list rendering matches the list lines only
        expect(renderList(list)).toEqual(lines.slice(0, 3));
    });
});
