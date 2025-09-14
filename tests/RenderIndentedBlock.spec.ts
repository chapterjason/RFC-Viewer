import {describe, expect, it} from 'vitest';
import {renderIndentedBlock} from '../src/Tree/Render/RenderIndentedBlock.js';
import type {IndentedBlockNode} from '../src/Tree/Node/IndentedBlockNode.js';

describe('RenderIndentedBlock', () => {
    it('re-applies base indentation and preserves relative indents', () => {
        // Arrange: base=4, second line is indented 4 more relative to base
        const node: IndentedBlockNode = {
            type: 'IndentedBlock',
            indent: 4,
            lines: [
                'GET /authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz',
                '    &redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb HTTP/1.1',
                'Host: server.example.com',
                '',
            ],
        };

        // Act
        const result = renderIndentedBlock(node);

        // Assert
        expect(result[0]).toMatch(/^\s{4}GET /);
        expect(result[1]).toMatch(/^\s{8}&redirect_uri=/);
        expect(result[2]).toMatch(/^\s{4}Host:/);
        expect(result[3]).toBe('');
    });
});
