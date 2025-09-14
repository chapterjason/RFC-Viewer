import {describe, expect, it} from 'vitest';
import {renderNode} from '../src/Tree/Render/RenderNode.js';
import type {TreeNode} from '../src/Tree/Node/TreeNode.js';

describe('RenderNode', () => {
    it('dispatches to specific renderers based on node type', () => {
        // Arrange
        const nodes: TreeNode[] = [
            {type: 'BlankLine'} as any,
            {type: 'PageBreak'} as any,
            {type: 'PageHeader', text: 'Header'} as any,
            {type: 'PageFooter', text: 'Footer'} as any,
        ];

        // Act
        const rendered = nodes.map(renderNode).flat();

        // Assert
        expect(rendered).toEqual(['', '\f', 'Header', 'Footer']);
    });

    it('falls back to empty render for unknown node types', () => {
        // Arrange
        const unknown: any = {type: 'Unknown'};

        // Act & Assert
        expect(renderNode(unknown as any)).toEqual([]);
    });
});
