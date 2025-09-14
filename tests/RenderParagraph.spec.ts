import {describe, expect, it} from 'vitest';
import {renderParagraph} from '../src/Tree/Render/RenderParagraph.js';
import type {ParagraphNode} from '../src/Tree/Node/ParagraphNode.js';

describe('RenderParagraph', () => {
    it('re-applies indent to non-blank lines and preserves blanks', () => {
        // Arrange
        const node: ParagraphNode = {
            type: 'Paragraph',
            indent: 3,
            lines: ['First line', '', 'Third line'],
        };

        // Act
        const result = renderParagraph(node);

        // Assert
        expect(result).toEqual(['   First line', '', '   Third line']);
    });
});
