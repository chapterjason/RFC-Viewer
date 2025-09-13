import {describe, expect, it} from 'vitest';
import {renderDocument} from '../src/Tree/Render/RenderDocument.js';
import type {DocumentNode} from '../src/Tree/Node/DocumentNode.js';
import type {TreeNode} from '../src/Tree/Node/TreeNode.js';

function makeRange() {
    return {start: {line: 0, column: 0, offset: null}, end: {line: 0, column: 0, offset: null}};
}

describe('RenderDocument', () => {
    it('renders children sequentially preserving blank lines', () => {
        // Arrange
        const children: TreeNode[] = [
            {type: 'PageFooter', position: makeRange(), text: 'Footer line before page break'} as any,
            {type: 'PageBreak', position: makeRange()} as any,
            {
                type: 'PageHeader',
                position: makeRange(),
                text: 'RFC 9999  Example Header                       January 2099'
            } as any,
            {type: 'BlankLine', position: makeRange()} as any,
        ];
        const doc: DocumentNode = {type: 'Document', position: makeRange(), children};

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

