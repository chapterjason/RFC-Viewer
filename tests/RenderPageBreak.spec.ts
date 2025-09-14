import {describe, expect, it} from 'vitest';
import {renderPageBreak} from '../src/Tree/Render/RenderPageBreak.js';
import type {PageBreakNode} from '../src/Tree/Node/PageBreakNode.js';

describe('RenderPageBreak', () => {
    it('renders a form feed character on its own line', () => {
        // Arrange
        const node: PageBreakNode = {type: 'PageBreak'} as any;

        // Act
        const result = renderPageBreak(node);

        // Assert
        expect(result).toEqual(['\f']);
    });
});
