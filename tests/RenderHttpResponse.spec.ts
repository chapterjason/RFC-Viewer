import {describe, expect, it} from 'vitest';
import {renderNode} from '../src/Tree/Render/RenderNode.js';

function makeRange() {
    return {start: {line: 0, column: 0, offset: null}, end: {line: 2, column: 0, offset: null}};
}

describe('RenderHttpResponse', () => {
    it('preserves response lines exactly', () => {
        // Arrange
        const node: any = {
            type: 'HttpResponse',
            lines: [
                '   HTTP/1.1 302 Found',
                '   Location: https://client.example.com/cb?error=access_denied&state=xyz'
            ],
            position: makeRange(),
        };

        // Act
        const rendered = renderNode(node);

        // Assert
        expect(rendered).toEqual(node.lines);
    });
});

