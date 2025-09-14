import {describe, expect, it} from 'vitest';
import {renderDocument} from '../src/Tree/Render/RenderDocument.js';
import type {DocumentNode} from '../src/Tree/Node/DocumentNode.js';
import type {TreeNode} from '../src/Tree/Node/TreeNode.js';

describe('RenderDocument', () => {
    it('renders children sequentially preserving blank lines', () => {
        // Arrange
        const children: TreeNode[] = [
            {type: 'PageFooter', text: 'Footer line before page break'} as any,
            {type: 'PageBreak'} as any,
            {
                type: 'PageHeader',
                text: 'RFC 9999  Example Header                       January 2099'
            } as any,
            {type: 'BlankLine'} as any,
        ];
        const doc: DocumentNode = {type: 'Document', children};

        // Act
        const rendered = renderDocument(doc);

        // Assert
        expect(rendered).toEqual([
            'Footer line before page break',
            '\f',
            'RFC 9999  Example Header                       January 2099',
            '',
        ]);
    });
});
