import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

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
        expect(list.items.length).toBe(1);
        const item = list.items[0];
        expect(item.lines.length).toBeGreaterThan(0);
        expect(item.lines[item.lines.length - 1]).not.toBe('');
    });
});

