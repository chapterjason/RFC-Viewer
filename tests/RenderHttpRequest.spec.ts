import {describe, expect, it} from 'vitest';
import {renderNode} from '../src/Tree/Render/RenderNode.js';

describe('RenderHttpRequest', () => {
    it('preserves request and header lines exactly', () => {
        // Arrange
        const node: any = {
            type: 'HttpRequest',
            indent: 3,
            requestLines: [
                'GET /authorize HTTP/1.1',
            ],
            headerLines: [
                'Host: example.com'
            ],
        };

        // Act
        const rendered = renderNode(node);

        // Assert
        const p = ' '.repeat(node.indent);
        expect(rendered).toEqual([p + node.requestLines[0], p + node.headerLines[0]]);
    });

    it('renders a blank line between headers and body', () => {
        const node: any = {
            type: 'HttpRequest',
            indent: 3,
            requestLines: [
                'POST /token HTTP/1.1',
            ],
            headerLines: [
                'Host: example.com',
                'Content-Type: application/json',
            ],
            bodyLines: [
                '{',
                '  "a": 1',
                '}'
            ],
        };
        const rendered = renderNode(node);
        const p = ' '.repeat(node.indent);
        expect(rendered).toEqual([
            p + node.requestLines[0],
            p + node.headerLines[0],
            p + node.headerLines[1],
            '',
            ...node.bodyLines.map(l => p + l),
        ]);
    });
});
