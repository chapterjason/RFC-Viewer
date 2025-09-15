import {describe, expect, it} from 'vitest';
import {renderList} from '../src/Tree/Render/RenderList.js';
import type {ListNode} from '../src/Tree/Node/ListNode.js';
import {ListItemNode} from "../src/Tree/Node/ListItemNode";

describe('RenderList', () => {
    it('concatenates rendered items in order', () => {
        // Arrange
        const items: ListItemNode[] = [
            {marker: '*', contentIndent: 3, markerIndent: 0, lines: ['Alpha']},
            {marker: '*', contentIndent: 3, markerIndent: 0, lines: ['Beta', 'cont.']},
        ];
        const node: ListNode = {type: 'List', items} as any;

        // Act
        const result = renderList(node);

        // Assert
        expect(result).toEqual(['*  Alpha', '*  Beta', '   cont.']);
    });
});
