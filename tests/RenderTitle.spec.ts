import {describe, expect, it} from 'vitest';
import {renderTitle} from '../src/Tree/Render/RenderTitle.js';
import type {TitleNode} from '../src/Tree/Node/TitleNode.js';

describe('RenderTitle', () => {
    it('returns title lines unchanged', () => {
        // Arrange
        const node: TitleNode = {
            type: 'Title',
            indent: 17,
            lines: ['The OAuth 2.0 Authorization Framework'],
        };

        // Act
        const result = renderTitle(node);

        // Assert
        expect(result).toEqual(['                 The OAuth 2.0 Authorization Framework']);
    });
});
