import {describe, expect, it} from 'vitest';
import {renderList} from '../src/Tree/Render/RenderList.js';
import type {ListNode} from '../src/Tree/Node/ListNode.js';
import type {ListItemNode} from '../src/Tree/Node/ListItemNode.js';
import type {ParagraphNode} from '../src/Tree/Node/ParagraphNode.js';

describe('renderList marker-only item', () => {
  it('renders marker on its own line, with content starting on the following line', () => {
    // Arrange: marker-only line followed by two content lines
    const paragraph: ParagraphNode = {
      type: 'Paragraph',
      indent: 0,
      lines: [
        'Raggett, D., Le Hors, A., and I. Jacobs, "HTML 4.01',
        'Specification", World Wide Web Consortium',
      ],
    };
    const item: ListItemNode = {
      type: 'ListItem',
      marker: '[W3C.REC-html401-19991224]',
      markerIndent: 3,
      contentIndent: 14,
      markerOnly: true,
      inline: false,
      children: [paragraph],
    };
    const node: ListNode = {type: 'List', items: [item]};

    // Act
    const lines = renderList(node);

    // Assert
    expect(lines[0]).toBe('   [W3C.REC-html401-19991224]');
    expect(lines[1]).toBe('              Raggett, D., Le Hors, A., and I. Jacobs, "HTML 4.01');
    expect(lines[2]).toBe('              Specification", World Wide Web Consortium');
  });
});
