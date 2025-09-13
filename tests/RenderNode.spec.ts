import {describe, expect, it} from 'vitest';
import {renderNode} from '../src/Tree/Render/RenderNode.js';
import type {TreeNode} from '../src/Tree/Node/TreeNode.js';

function makeRange() {
    return {start: {line: 0, column: 0, offset: null}, end: {line: 0, column: 0, offset: null}};
}

describe('RenderNode', () => {
    it('dispatches to specific renderers based on node type', () => {
        // Arrange
        const nodes: TreeNode[] = [
            {type: 'BlankLine', position: makeRange()} as any,
            {type: 'PageBreak', position: makeRange()} as any,
            {type: 'PageHeader', position: makeRange(), text: 'Header'} as any,
            {type: 'PageFooter', position: makeRange(), text: 'Footer'} as any,
        ];

        // Act
        const rendered = nodes.map(renderNode).flat();

        // Assert
        expect(rendered).toEqual(['', '\f', 'Header', 'Footer']);
    });

    it('falls back to empty render for unknown node types', () => {
        // Arrange
        const unknown: any = {type: 'Unknown', position: makeRange()};

        // Act & Assert
        expect(renderNode(unknown as any)).toEqual([]);
    });
});

