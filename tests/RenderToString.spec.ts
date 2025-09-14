import {describe, expect, it} from 'vitest';
import {renderToString} from '../src/Tree/Render/RenderToString.js';
import type {DocumentNode} from '../src/Tree/Node/DocumentNode.js';

describe('RenderToString', () => {
    it('joins document render with \n delimiters', () => {
        // Arrange
        const doc: DocumentNode = {
            type: 'Document',
            children: [
                {type: 'PageHeader', text: 'H'} as any,
                {type: 'BlankLine'} as any,
                {type: 'PageFooter', text: 'F'} as any,
            ],
        };

        // Act
        const rendered = renderToString(doc);

        // Assert
        expect(rendered).toBe('H\n\nF');
    });
});
