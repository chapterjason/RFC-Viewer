import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('parse using RFC-like snippets with context', () => {
    it('parses an indented HTTP request block (RFC 6749) with surrounding context', () => {
        // Arrange: RFC-like example with preface/blank lines/indented block/postface
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
        // Act: parse into a Document AST
        const actualValue = parse(new ArrayCursor(snippetWithContext));
        // Assert: block kinds and order around the indented block
        const expectedValue = [
            'Paragraph',
            'BlankLine',
            'IndentedBlock',
            'BlankLine',
            'Paragraph',
        ];
        const actualKinds = actualValue.children.map((node: any) => node.type);
        expect(actualKinds).toEqual(expectedValue);

        // Assert: indented block shape and content lines
        const indentedBlock: any = actualValue.children[2];
        expect(indentedBlock.type).toBe('IndentedBlock');
        expect(indentedBlock.indent).toBe(4);
        expect(indentedBlock.lines.length).toBe(3);
        expect(indentedBlock.lines[0]).toMatch(/^GET \/authorize\?response_type=code/);
        expect(indentedBlock.lines[1]).toMatch(/^\s{4}&redirect_uri=/);
        expect(indentedBlock.lines[2]).toBe('Host: server.example.com');
    });

    it('groups consecutive non-blank ToC lines into a paragraph with surrounding context', () => {
        // Arrange: blank line, heading, blank, ToC lines, blank, narrative
        const snippetWithContext = [
            '',
            'Table of Contents',
            '',
            '1. Introduction ....................................................4',
            '  1.1. Roles ......................................................6',
            '',
            'Some narrative text after the table of contents.',
        ];
        // Act: parse into a Document AST
        const actualValue = parse(new ArrayCursor(snippetWithContext));
        // Assert: block kinds and grouping of ToC paragraph
        const expectedValue = [
            'BlankLine',
            'Paragraph',
            'BlankLine',
            'Paragraph',
            'BlankLine',
            'Paragraph',
        ];
        const actualKinds = actualValue.children.map((node: any) => node.type);
        expect(actualKinds).toEqual(expectedValue);

        // Assert: ToC paragraph contains exactly the two ToC lines
        const tableOfContentsParagraph: any = actualValue.children[3];
        expect(tableOfContentsParagraph.type).toBe('Paragraph');
        expect(tableOfContentsParagraph.lines.length).toBe(2);
        expect(tableOfContentsParagraph.lines[0]).toMatch(/Introduction/);
        expect(tableOfContentsParagraph.lines[1]).toMatch(/Roles|Implicit|Authorization Code|Resource Owner/);
    });
});
