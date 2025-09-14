import {describe, expect, it} from 'vitest';
import {renderNode} from '../src/Tree/Render/RenderNode.js';

describe('RenderHttpRequest', () => {
    it('preserves request lines exactly', () => {
        // Arrange
        const node: any = {
            type: 'HttpRequest',
            lines: [
                '   GET /authorize HTTP/1.1',
                '   Host: example.com'
            ],
        };

        // Act
        const rendered = renderNode(node);

        // Assert
        expect(rendered).toEqual(node.lines);
    });

    it('renders a blank line between headers and body', () => {
        const node: any = {
            type: 'HttpRequest',
            lines: [
                '   POST /token HTTP/1.1',
                '   Host: example.com',
                '   Content-Type: application/json',
            ],
            bodyLines: [
                '   {',
                '     "a": 1',
                '   }'
            ],
        };
        const rendered = renderNode(node);
        expect(rendered).toEqual([...node.lines, '', ...node.bodyLines]);
    });
});
