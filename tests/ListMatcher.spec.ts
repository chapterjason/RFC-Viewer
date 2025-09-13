import {describe, expect, it} from 'vitest';
import type {BlockContext} from '../src/Tree/BlockContext.js';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {ListMatcher} from '../src/Tree/Matcher/ListMatcher.js';
import {parse} from '../src/Tree/Parser.js';

function createTestContext(lines: string[]): BlockContext {
    const cursor = new ArrayCursor(lines);
    return {
        cursor,
        peek: (offset: number) => cursor.peek(offset),
        advance: () => cursor.next(),
        state: {seenMetadata: false, seenTitle: false},
    };
}

describe('ListMatcher', () => {
    it('parses classic o-bullets with indentation', () => {
        // Arrange
        const lines = [
            '   o  Response type name: token',
            '   o  Change controller: IETF',
            '   o  Specification document(s): RFC 6749',
        ];
        const context = createTestContext(lines);

        // Act
        const canMatch = ListMatcher.test(context);
        const node = ListMatcher.parse(context) as any;

        // Assert
        expect(canMatch).toBe(true);
        expect(node.type).toBe('List');
        expect(node.items.length).toBe(3);
        expect(node.items[0].marker).toBe('o');
        expect(node.items[0].lines[0]).toBe('Response type name: token');
        expect(node.items[1].lines[0]).toBe('Change controller: IETF');
        expect(node.items[2].lines[0]).toContain('RFC 6749');
    });

    it('parses star bullets with wrapped continuation lines', () => {
        // Arrange
        const lines = [
            '   *  First point starts here and',
            '      continues on the next line.',
            '   *  Second point',
        ];
        const context = createTestContext(lines);

        // Act
        const node = ListMatcher.parse(context) as any;

        // Assert
        expect(node.type).toBe('List');
        expect(node.items.length).toBe(2);
        expect(node.items[0].marker).toBe('*');
        expect(node.items[0].lines.length).toBe(2);
        expect(node.items[0].lines[0]).toMatch(/^First point starts here/);
        expect(node.items[0].lines[1]).toMatch(/^continues on the next line\./);
    });

    it('parses numbered and alpha-paren bullets', () => {
        // Arrange
        const snippetWithContext = [
            '',
            '1. First',
            '2. Second',
            '',
            '   (A)  Apple',
            '   (B)  Banana',
            '',
        ];

        // Act
        const doc = parse(new ArrayCursor(snippetWithContext));
        const kinds = doc.children.map((n: any) => n.type);

        // Assert: two lists separated by blanks
        expect(kinds).toEqual(['BlankLine', 'List', 'BlankLine', 'List', 'BlankLine']);
        const firstList: any = doc.children[1];
        expect(firstList.items.map((i: any) => i.marker)).toEqual(['1.', '2.']);
        const secondList: any = doc.children[3];
        expect(secondList.items.map((i: any) => i.marker)).toEqual(['(A)', '(B)']);
    });

    it('parses bracketed bullets like [TEXT]', () => {
        // Arrange
        const lines = [
            '   [TOKEN] Token endpoint details',
            '   [AUTHZ] Authorization endpoint details',
        ];
        const context = createTestContext(lines);

        // Act
        const node = ListMatcher.parse(context) as any;

        // Assert
        expect(node.type).toBe('List');
        expect(node.items.length).toBe(2);
        expect(node.items[0].marker).toBe('[TOKEN]');
        expect(node.items[1].marker).toBe('[AUTHZ]');
    });

    it('parses bracketed reference keys with punctuation and digits', () => {
        // Arrange: RFC-style reference entry with bracketed key
        const lines = [
            '   [W3C.REC-html401-19991224]  HTML 4.01 Specification',
            '                               December 1999.',
        ];
        const context = createTestContext(lines);

        // Act
        const node = ListMatcher.parse(context) as any;

        // Assert
        expect(node.type).toBe('List');
        expect(node.items.length).toBe(1);
        expect(node.items[0].marker).toBe('[W3C.REC-html401-19991224]');
        expect(node.items[0].lines[0]).toMatch(/^HTML 4\.01 Specification/);
        expect(node.items[0].lines[1]).toMatch(/^December 1999\./);
    });

    it('parses bracketed reference key on its own line with content on next line', () => {
        // Arrange: matches RFC reference layout where key line carries only the marker
        const snippetWithContext = [
            '   [W3C.REC-html401-19991224]',
            '              Raggett, D., Le Hors, A., and I. Jacobs, "HTML 4.01',
            '              Specification", World Wide Web Consortium',
            '',
        ];

        // Act
        const doc = parse(new ArrayCursor(snippetWithContext));
        const kinds = doc.children.map((n: any) => n.type);

        // Assert: a single List followed by BlankLine
        expect(kinds).toEqual(['List', 'BlankLine']);
        const list: any = doc.children[0];
        expect(list.items.length).toBe(1);
        expect(list.items[0].marker).toBe('[W3C.REC-html401-19991224]');
        expect(list.items[0].lines[0]).toMatch(/^Raggett, D\./);
        expect(list.items[0].lines.length).toBe(2);
    });

    it('does not misclassify ToC lines as lists', () => {
        // Arrange: looks like a numbered start but is ToC
        const snippetWithContext = [
            'Table of Contents',
            '',
            '1. Introduction ....................................................4',
            '  1.1. Roles ......................................................6',
            '',
        ];

        // Act
        const doc = parse(new ArrayCursor(snippetWithContext));
        const kinds = doc.children.map((n: any) => n.type);

        // Assert: remains a SectionTitle then TableOfContents then BlankLine
        expect(kinds).toEqual(['SectionTitle', 'BlankLine', 'TableOfContents', 'BlankLine']);
    });
});
