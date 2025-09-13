import {describe, expect, it} from 'vitest';
import {renderList} from '../src/Tree/Render/RenderList.js';
import type {ListItemNode, ListNode} from '../src/Tree/Node/ListNode.js';

function makeRange() {
  return {start: {line: 0, column: 0, offset: null}, end: {line: 0, column: 0, offset: null}};
}

describe('RenderList marker-only item', () => {
  it('renders marker on its own line, with content starting on the following line', () => {
    // Arrange: marker-only line followed by two content lines
    const item: ListItemNode = {
      marker: '[W3C.REC-html401-19991224]',
      markerIndent: 3,
      contentIndent: 14,
      markerOnly: true,
      lines: [
        'Raggett, D., Le Hors, A., and I. Jacobs, "HTML 4.01',
        'Specification", World Wide Web Consortium',
      ],
    } as any;
    const node: ListNode = {type: 'List', position: makeRange(), items: [item]};

    // Act
    const lines = renderList(node);

    // Assert
    expect(lines[0]).toBe('   [W3C.REC-html401-19991224]');
    expect(lines[1]).toBe('              Raggett, D., Le Hors, A., and I. Jacobs, "HTML 4.01');
    expect(lines[2]).toBe('              Specification", World Wide Web Consortium');
  });
});

