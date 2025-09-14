import {describe, expect, it} from 'vitest';
import {renderSectionTitle} from '../src/Tree/Render/RenderSectionTitle.js';
import type {SectionTitleNode} from '../src/Tree/Node/SectionTitleNode.js';

describe('RenderSectionTitle', () => {
    it('returns section title lines unchanged', () => {
        // Arrange
        const node: SectionTitleNode = {
            type: 'SectionTitle',
            lines: ['Abstract'],
        };

        // Act
        const result = renderSectionTitle(node);

        // Assert
        expect(result).toEqual(['Abstract']);
    });
});
