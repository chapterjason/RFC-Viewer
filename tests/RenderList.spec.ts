import {describe, expect, it} from 'vitest';
import {renderList} from '../src/Tree/Render/RenderList.js';
import type {ListNode} from '../src/Tree/Node/ListNode.js';
import type {ListItemNode} from '../src/Tree/Node/ListItemNode.js';
import type {ParagraphNode} from '../src/Tree/Node/ParagraphNode.js';

describe('renderList', () => {
    it('concatenates rendered items in order', () => {
        // Arrange
        const paragraphA: ParagraphNode = {type: 'Paragraph', indent: 0, lines: ['Alpha']};
        const paragraphB: ParagraphNode = {type: 'Paragraph', indent: 0, lines: ['Beta', 'cont.']};
        const items: ListItemNode[] = [
            {type: 'ListItem', marker: '*', contentIndent: 3, markerIndent: 0, markerOnly: false, inline: true, children: [paragraphA]},
            {type: 'ListItem', marker: '*', contentIndent: 3, markerIndent: 0, markerOnly: false, inline: true, children: [paragraphB]},
        ];
        const node: ListNode = {type: 'List', items};

        // Act
        const result = renderList(node);

        // Assert
        expect(result).toEqual(['*  Alpha', '*  Beta', '   cont.']);
    });
});
