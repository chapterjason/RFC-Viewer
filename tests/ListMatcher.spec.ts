import {describe, expect, it} from 'vitest';
import type {BlockContext} from '../src/Tree/BlockContext.js';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {ListMatcher} from '../src/Tree/Matcher/ListMatcher.js';
import {parse} from '../src/Tree/Parser.js';
import {renderList} from '../src/Tree/Render/RenderList.js';
import type {ListNode} from '../src/Tree/Node/ListNode.js';
import type {ListItemNode} from '../src/Tree/Node/ListItemNode.js';
import type {ParagraphNode} from '../src/Tree/Node/ParagraphNode.js';

function createTestContext(lines: string[]): BlockContext {
    const cursor = new ArrayCursor(lines);
    return {
        cursor,
        peek: (offset: number) => cursor.peek(offset),
        advance: () => cursor.next(),
        state: {seenMetadata: false, seenTitle: false},
    };
}

function collectParagraphLines(item: ListItemNode): string[] {
    return item.children
        .filter((child): child is ParagraphNode => child.type === 'Paragraph')
        .flatMap((paragraph) => paragraph.lines);
}

function firstParagraphLine(item: ListItemNode): string | undefined {
    const lines = collectParagraphLines(item);
    return lines[0];
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
        const listItems = node.items.filter((it: any) => it.type === 'ListItem') as ListItemNode[];
        expect(listItems).toHaveLength(3);
        expect(listItems[0].marker).toBe('o');
        expect(listItems[0].markerIndent).toBe(3);
        expect(listItems[0].contentIndent).toBe(6);
        expect(firstParagraphLine(listItems[0])).toBe('Response type name: token');
        expect(firstParagraphLine(listItems[1])).toBe('Change controller: IETF');
        expect(firstParagraphLine(listItems[2])).toContain('RFC 6749');
        expect(renderList(node)).toEqual(lines);
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
        const listItems = node.items.filter((it: any) => it.type === 'ListItem') as ListItemNode[];
        expect(listItems).toHaveLength(2);
        expect(listItems[0].marker).toBe('*');
        const firstParagraph = collectParagraphLines(listItems[0]);
        expect(firstParagraph).toHaveLength(2);
        expect(firstParagraph[0]).toMatch(/^First point starts here/);
        expect(firstParagraph[1]).toMatch(/^continues on the next line\./);
        expect(renderList(node)).toEqual(lines);
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

        // Assert: single list with nested alphabetical list under second item
        expect(kinds).toEqual(['BlankLine', 'List', 'BlankLine']);
        const firstList: any = doc.children[1];
        const listItems = firstList.items.filter((it: any) => it.type === 'ListItem') as ListItemNode[];
        expect(listItems).toHaveLength(2);
        expect(listItems[0].marker).toBe('1.');
        expect(listItems[1].marker).toBe('2.');
        const nested = listItems[1].children.find((child) => child.type === 'List') as ListNode | undefined;
        expect(nested).toBeDefined();
        const nestedMarkers = nested!.items.filter((it: any) => it.type === 'ListItem').map((it: ListItemNode) => it.marker);
        expect(nestedMarkers).toEqual(['(A)', '(B)']);
    });

    it('parses bracketed bullets like [TEXT]', () => {
        // Arrange
        const lines = [
            '   [TOKEN]  Token endpoint details',
            '   [AUTHZ]  Authorization endpoint details',
        ];
        const context = createTestContext(lines);

        // Act
        const node = ListMatcher.parse(context) as any;

        // Assert
        expect(node.type).toBe('List');
        const listItems = node.items.filter((it: any) => it.type === 'ListItem') as ListItemNode[];
        expect(listItems).toHaveLength(2);
        expect(listItems[0].marker).toBe('[TOKEN]');
        expect(listItems[1].marker).toBe('[AUTHZ]');
        expect(renderList(node)).toEqual(lines);
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
        const listItems = node.items.filter((it: any) => it.type === 'ListItem') as ListItemNode[];
        expect(listItems).toHaveLength(1);
        expect(listItems[0].marker).toBe('[W3C.REC-html401-19991224]');
        const paragraphLines = collectParagraphLines(listItems[0]);
        expect(paragraphLines[0]).toMatch(/^HTML 4\.01 Specification/);
        expect(paragraphLines[1]).toMatch(/^December 1999\./);
        expect(renderList(node)).toEqual(lines);
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
        const onlyItem = list.items.find((it: any) => it.type === 'ListItem') as ListItemNode;
        expect(onlyItem.marker).toBe('[W3C.REC-html401-19991224]');
        const paragraphLines = collectParagraphLines(onlyItem);
        expect(paragraphLines[0]).toMatch(/^Raggett, D\./);
        expect(paragraphLines).toHaveLength(2);
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

    it('does not start a new item when the marker indent differs (e.g., (PKIX) under content column)', () => {
        // Arrange: RFC-style reference where a parenthetical token appears under the content column
        // and should NOT be treated as a new list item.
        const lines = [
            '',
            '   [RFC6125]  Saint-Andre, P. and J. Hodges, "Representation and',
            '              Verification of Domain-Based Application Service Identity',
            '              within Internet Public Key Infrastructure Using X.509',
            '              (PKIX) Certificates in the Context of Transport Layer',
            '              Security (TLS)", RFC 6125, March 2011.',
            '',
            '   [USASCII]  American National Standards Institute, "Coded Character',
            '              Set -- 7-bit American Standard Code for Information',
            '              Interchange", ANSI X3.4, 1986.',
            '',
        ];
        // Act: parse entire document because snippet includes leading/trailing blanks
        const doc = parse(new ArrayCursor(lines));
        const listNodes = doc.children.filter((n: any) => n.type === 'List');

        // Assert: single list containing both entries separated by a BlankLine
        expect(listNodes.length).toBe(1);
        const firstList: any = listNodes[0];
        const entries = firstList.items;
        expect(entries.map((entry: any) => entry.type)).toEqual(['ListItem', 'BlankLine', 'ListItem']);
        const firstListItems = entries.filter((it: any) => it.type === 'ListItem') as ListItemNode[];
        expect(firstListItems[0].marker).toBe('[RFC6125]');
        const nestedList = firstListItems[0].children.find((child) => child.type === 'List') as ListNode | undefined;
        expect(nestedList).toBeDefined();
        const nestedMarkers = nestedList!.items.filter((it: any) => it.type === 'ListItem').map((it: ListItemNode) => it.marker);
        expect(nestedMarkers).toEqual(['(PKIX)']);
        expect(firstListItems[1].marker).toBe('[USASCII]');
    });
});
