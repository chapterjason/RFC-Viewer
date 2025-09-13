import {describe, expect, it} from 'vitest';
import {renderPageBreak} from '../src/Tree/Render/RenderPageBreak.js';
import type {PageBreakNode} from '../src/Tree/Node/PageBreakNode.js';

function makeRange() {
    return {start: {line: 0, column: 0, offset: null}, end: {line: 0, column: 0, offset: null}};
}

describe('RenderPageBreak', () => {
    it('renders a form feed character on its own line', () => {
        // Arrange
        const node: PageBreakNode = {type: 'PageBreak', position: makeRange()};

        // Act
        const result = renderPageBreak(node);

        // Assert
        expect(result).toEqual(['\f']);
    });
});

