import {describe, expect, it} from 'vitest';
import {renderNode} from '../src/Tree/Render/RenderNode.js';

describe('RenderHttpResponse', () => {
    it('preserves response lines exactly', () => {
        // Arrange
        const node: any = {
            type: 'HttpResponse',
            lines: [
                '   HTTP/1.1 302 Found',
                '   Location: https://client.example.com/cb?error=access_denied&state=xyz'
            ],
        };

        // Act
        const rendered = renderNode(node);

        // Assert
        expect(rendered).toEqual(node.lines);
    });
});
