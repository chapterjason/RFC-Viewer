import {describe, expect, it} from 'vitest';
import {renderToString} from '../src/Tree/Render/RenderToString.js';
import type {DocumentNode} from '../src/Tree/Node/DocumentNode.js';

function makeRange() {
    return {start: {line: 0, column: 0, offset: null}, end: {line: 0, column: 0, offset: null}};
}

describe('RenderToString', () => {
    it('joins document render with \n delimiters', () => {
        // Arrange
        const doc: DocumentNode = {
            type: 'Document',
            position: makeRange(),
            children: [
                {type: 'PageHeader', position: makeRange(), text: 'H'} as any,
                {type: 'BlankLine', position: makeRange()} as any,
                {type: 'PageFooter', position: makeRange(), text: 'F'} as any,
            ],
        };

        // Act
        const rendered = renderToString(doc);

        // Assert
        expect(rendered).toBe('H\n\nF');
    });
});

