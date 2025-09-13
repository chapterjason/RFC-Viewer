import {describe, expect, it} from 'vitest';
import {renderSectionTitle} from '../src/Tree/Render/RenderSectionTitle.js';
import type {SectionTitleNode} from '../src/Tree/Node/SectionTitleNode.js';

function makeRange() {
    return {start: {line: 8, column: 0, offset: null}, end: {line: 9, column: 0, offset: null}};
}

describe('RenderSectionTitle', () => {
    it('returns section title lines unchanged', () => {
        // Arrange
        const node: SectionTitleNode = {
            type: 'SectionTitle',
            position: makeRange(),
            lines: ['Abstract'],
        };

        // Act
        const result = renderSectionTitle(node);

        // Assert
        expect(result).toEqual(['Abstract']);
    });
});

