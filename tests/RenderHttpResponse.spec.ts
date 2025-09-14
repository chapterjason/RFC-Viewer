import {describe, expect, it} from 'vitest';
import {renderNode} from '../src/Tree/Render/RenderNode.js';

describe('RenderHttpResponse', () => {
    it('preserves response lines exactly', () => {
        // Arrange (trimmed lines + indent)
        const node: any = {
            type: 'HttpResponse',
            indent: 3,
            statusLine: 'HTTP/1.1 302 Found',
            headerLines: [
                'Location: https://client.example.com/cb?error=access_denied&state=xyz'
            ],
        };

        const expected = [
            '   HTTP/1.1 302 Found',
            '   Location: https://client.example.com/cb?error=access_denied&state=xyz'
        ];

        // Act
        const rendered = renderNode(node);

        // Assert
        expect(rendered).toEqual(expected);
    });
});
