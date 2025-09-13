import {describe, expect, it} from 'vitest';
import {renderMetadata} from '../src/Tree/Render/RenderMetadata.js';
import type {MetadataNode} from '../src/Tree/Node/MetadataNode.js';

function makeRange() {
    return {start: {line: 0, column: 0, offset: null}, end: {line: 2, column: 0, offset: null}};
}

describe('RenderMetadata', () => {
    it('returns metadata lines unchanged', () => {
        // Arrange
        const node: MetadataNode = {
            type: 'Metadata',
            position: makeRange(),
            lines: ['RFC 6749  OAuth 2.0                                  October 2012'],
        };

        // Act
        const result = renderMetadata(node);

        // Assert
        expect(result).toEqual(['RFC 6749  OAuth 2.0                                  October 2012']);
    });
});

