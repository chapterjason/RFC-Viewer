import {describe, expect, it} from 'vitest';
import {renderBlankLine} from '../src/Tree/Render/RenderBlankLine.js';
import type {BlankLineNode} from '../src/Tree/Node/BlankLineNode.js';

function makeRange() {
    return {start: {line: 0, column: 0, offset: null}, end: {line: 0, column: 0, offset: null}};
}

describe('RenderBlankLine', () => {
    it('emits a single empty string without spaces', () => {
        // Arrange
        const node: BlankLineNode = {type: 'BlankLine', position: makeRange()};

        // Act
        const result = renderBlankLine(node);

        // Assert
        expect(result).toEqual([""]);
        expect(result[0]).toBe("");
    });
});

