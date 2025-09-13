import { describe, it, expect } from 'vitest';
import { ArrayCursor } from '../src/Utils/ArrayCursor.js';
import { parse } from '../src/Tree/Parser.js';

describe('parse using RFC-like snippets with context', () => {
  it('parses an indented HTTP request block (RFC 6749) with surrounding context', () => {
    const snippetWithContext = [
      'Preface text about the upcoming example.',
      'Additional details continue here.',
      '',
      '    GET /authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz',
      '        &redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb HTTP/1.1',
      '    Host: server.example.com',
      '',
      'Postface explanation of what the example demonstrates.',
      'Final remark after the example.',
    ];
    const documentNode = parse(new ArrayCursor(snippetWithContext));
    expect(documentNode.children.map((node: any) => node.type)).toEqual([
      'Paragraph',
      'BlankLine',
      'IndentedBlock',
      'BlankLine',
      'Paragraph',
    ]);

    const indentedBlock: any = documentNode.children[2];
    expect(indentedBlock.type).toBe('IndentedBlock');
    expect(indentedBlock.indent).toBe(4);
    expect(indentedBlock.lines.length).toBe(3);
    expect(indentedBlock.lines[0]).toMatch(/^GET \/authorize\?response_type=code/);
    expect(indentedBlock.lines[1]).toMatch(/^\s{4}&redirect_uri=/);
    expect(indentedBlock.lines[2]).toBe('Host: server.example.com');
  });

  it('groups consecutive non-blank ToC lines into a paragraph with surrounding context', () => {
    const snippetWithContext = [
      '',
      'Table of Contents',
      '',
      '1. Introduction ....................................................4',
      '  1.1. Roles ......................................................6',
      '',
      'Some narrative text after the table of contents.',
    ];
    const documentNode = parse(new ArrayCursor(snippetWithContext));
    expect(documentNode.children.map((node: any) => node.type)).toEqual([
      'BlankLine',
      'Paragraph',
      'BlankLine',
      'Paragraph',
      'BlankLine',
      'Paragraph',
    ]);

    const tableOfContentsParagraph: any = documentNode.children[3];
    expect(tableOfContentsParagraph.type).toBe('Paragraph');
    expect(tableOfContentsParagraph.lines.length).toBe(2);
    expect(tableOfContentsParagraph.lines[0]).toMatch(/Introduction/);
    expect(tableOfContentsParagraph.lines[1]).toMatch(/Roles|Implicit|Authorization Code|Resource Owner/);
  });
});
