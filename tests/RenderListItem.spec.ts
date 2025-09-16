import {describe, expect, it} from 'vitest';
import {renderListItem} from '../src/Tree/Render/RenderListItem.js';
import type {ListItemNode} from '../src/Tree/Node/ListItemNode.js';
import type {ParagraphNode} from '../src/Tree/Node/ParagraphNode.js';

const noopRenderNestedList = () => [] as string[];

describe('renderListItem', () => {
    it('normalizes bullet layout with content at contentIndent', () => {
        // Arrange: marker="*" (1 char), contentIndent=3 => gap of 2 spaces
        const paragraph: ParagraphNode = {
            type: 'Paragraph',
            indent: 0,
            lines: ['First point starts here', 'continues on the next line.'],
        };
        const item: ListItemNode = {
            type: 'ListItem',
            marker: '*',
            contentIndent: 3,
            markerIndent: 0,
            markerOnly: false,
            inline: true,
            children: [paragraph],
        };

        // Act
        const result = renderListItem(item, noopRenderNestedList);

        // Assert
        expect(result[0]).toBe('*  First point starts here');
        expect(result[1]).toBe('   continues on the next line.');
    });

    it('handles numbered markers and blank continuation lines', () => {
        // Arrange: marker="1." (2 chars), contentIndent=4 => gap of 2 spaces, blank continuation preserved
        const paragraph: ParagraphNode = {
            type: 'Paragraph',
            indent: 0,
            lines: ['First numbered'],
        };
        const item: ListItemNode = {
            type: 'ListItem',
            marker: '1.',
            contentIndent: 4,
            markerIndent: 0,
            markerOnly: false,
            inline: true,
            children: [paragraph, {type: 'BlankLine'}],
        };

        // Act
        const result = renderListItem(item, noopRenderNestedList);

        // Assert
        expect(result).toEqual(['1.  First numbered', '']);
    });

    it('aligns marker and continuation indent using markerIndent and contentIndent', () => {
        // Arrange: markerIndent=3 ensures marker indentation and contentIndent=6 aligns continuation lines
        const paragraph: ParagraphNode = {
            type: 'Paragraph',
            indent: 0,
            lines: ['First bullet line', 'wraps onto continuation'],
        };
        const item: ListItemNode = {
            type: 'ListItem',
            marker: 'o',
            contentIndent: 6,
            markerIndent: 3,
            markerOnly: false,
            inline: true,
            children: [paragraph],
        };

        // Act
        const result = renderListItem(item, noopRenderNestedList);

        // Assert
        expect(result).toEqual(['   o  First bullet line', '      wraps onto continuation']);
    });
});
