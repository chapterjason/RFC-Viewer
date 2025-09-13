import {describe, expect, it} from 'vitest';
import {renderParagraph} from '../src/Tree/Render/RenderParagraph.js';
import type {ParagraphNode} from '../src/Tree/Node/ParagraphNode.js';

function makeRange() {
    return {start: {line: 1, column: 0, offset: null}, end: {line: 3, column: 0, offset: null}};
}

describe('RenderParagraph', () => {
    it('preserves paragraph lines exactly', () => {
        // Arrange
        const node: ParagraphNode = {
            type: 'Paragraph',
            position: makeRange(),
            lines: ['First line', '', 'Third line'],
        };

        // Act
        const result = renderParagraph(node);

        // Assert
        expect(result).toEqual(['First line', '', 'Third line']);
    });
});

