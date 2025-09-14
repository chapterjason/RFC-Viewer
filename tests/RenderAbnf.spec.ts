import {describe, it, expect} from 'vitest';
import {renderNode} from '../src/Tree/Render/RenderNode.js';

describe('RenderAbnf', () => {
    it('preserves ABNF lines exactly', () => {
        // Arrange
        const node = {
            type: 'Abnf',
            lines: [
                '  token = 1*( %x41-5A / %x61-7A )',
                '          / %x30-39',
            ],
        } as any;

        // Act
        const rendered = renderNode(node);

        // Assert
        expect(rendered).toEqual([
            '  token = 1*( %x41-5A / %x61-7A )',
            '          / %x30-39',
        ]);
    });
});
