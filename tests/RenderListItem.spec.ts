import {describe, expect, it} from 'vitest';
import {renderListItem} from '../src/Tree/Render/RenderListItem.js';
import type {ListItemNode} from '../src/Tree/Node/ListNode.js';

describe('RenderListItem', () => {
    it('normalizes bullet layout with content at contentIndent', () => {
        // Arrange: marker="*" (1 char), contentIndent=3 => gap of 2 spaces
        const item: ListItemNode = {
            marker: '*',
            contentIndent: 3,
            lines: ['First point starts here', 'continues on the next line.'],
        };

        // Act
        const result = renderListItem(item);

        // Assert
        expect(result[0]).toBe('*  First point starts here');
        expect(result[1]).toBe('   continues on the next line.');
    });

    it('handles numbered markers and blank continuation lines', () => {
        // Arrange: marker="1." (2 chars), contentIndent=4 => gap of 2 spaces, blank continuation preserved
        const item: ListItemNode = {
            marker: '1.',
            contentIndent: 4,
            lines: ['First numbered', ''],
        };

        // Act
        const result = renderListItem(item);

        // Assert
        expect(result).toEqual(['1.  First numbered', '']);
    });
});

