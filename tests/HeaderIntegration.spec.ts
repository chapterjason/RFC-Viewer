import {describe, it, expect} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('Header integration', () => {
  it('parses leading blanks, one Metadata, blanks, one Title, then body', () => {
    // Arrange: RFC-like snippet
    const snippet = [
      '',
      'Internet Engineering Task Force (IETF)                     D. Hardt, Ed.',
      'Request for Comments: 6749                                     Microsoft',
      'Category: Standards Track',
      '',
      '                 The OAuth 2.0 Authorization Framework',
      '',
      'Abstract',
      '',
      'Some text after the abstract.',
    ];

    // Act: parse into a Document AST
    const actualValue = parse(new ArrayCursor(snippet));

    // Assert: node kinds and order
    const expectedKinds = [
      'BlankLine',
      'Metadata',
      'BlankLine',
      'Title',
      'BlankLine',
      'Paragraph',
      'BlankLine',
      'Paragraph',
    ];
    const actualKinds = actualValue.children.map((node: any) => node.type);
    expect(actualKinds).toEqual(expectedKinds);

    // Assert: title contents
    const title: any = actualValue.children[3];
    expect(title.type).toBe('Title');
    expect(title.lines.length).toBe(1);
    expect(title.lines[0].trim()).toBe('The OAuth 2.0 Authorization Framework');
  });
});

