import {describe, expect, it} from 'vitest';
import {renderMetadata} from '../src/Tree/Render/RenderMetadata.js';
import type {MetadataNode} from '../src/Tree/Node/MetadataNode.js';

describe('RenderMetadata', () => {
    it('returns metadata lines unchanged', () => {
        // Arrange
        const node: MetadataNode = {
            type: 'Metadata',
            lines: ['RFC 6749  OAuth 2.0                                  October 2012'],
        };

        // Act
        const result = renderMetadata(node);

        // Assert
        expect(result).toEqual(['RFC 6749  OAuth 2.0                                  October 2012']);
    });
});
