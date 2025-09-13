import {describe, expect, it} from 'vitest';
import {renderList} from '../src/Tree/Render/RenderList.js';
import type {ListItemNode, ListNode} from '../src/Tree/Node/ListNode.js';

function makeRange() {
    return {start: {line: 0, column: 0, offset: null}, end: {line: 0, column: 0, offset: null}};
}

describe('RenderList', () => {
    it('concatenates rendered items in order', () => {
        // Arrange
        const items: ListItemNode[] = [
            {marker: '*', contentIndent: 3, lines: ['Alpha']},
            {marker: '*', contentIndent: 3, lines: ['Beta', 'cont.']},
        ];
        const node: ListNode = {type: 'List', position: makeRange(), items};

        // Act
        const result = renderList(node);

        // Assert
        expect(result).toEqual(['*  Alpha', '*  Beta', '   cont.']);
    });
});

