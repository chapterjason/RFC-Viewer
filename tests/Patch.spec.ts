import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';
import {patch} from '../src/Tree/Patch/Patch.js';
import {renderDocument} from '../src/Tree/Render/RenderDocument.js';

describe('Patch', () => {
    it('replaces a paragraph line via JSON Pointer path', () => {
        // Arrange: simple document with single paragraph
        const lines = [
            '   First paragraph line',
            '   Second paragraph line',
        ];
        const document = parse(new ArrayCursor(lines));

        // Act: replace the first line
        patch(document, [
            {op: 'replace', path: '/children/0/lines/0', value: 'Edited first line'},
        ]);

        // Assert: only the targeted line changed
        const paragraph: any = document.children[0];
        expect(paragraph.type).toBe('Paragraph');
        expect(paragraph.indent).toBe(3);
        expect(paragraph.lines[0]).toBe('Edited first line');
        expect(paragraph.lines[1]).toBe('Second paragraph line');

        // Assert: render round-trip preserves indentation and content
        const rendered = renderDocument(document);
        expect(rendered[0]).toBe('   Edited first line');
        expect(rendered[1]).toBe('   Second paragraph line');
    });

    it('adds a BlankLine node to the end of children', () => {
        // Arrange: paragraph, blank line, paragraph
        const snippet = [
            '   Para A',
            '',
            '   Para B',
        ];
        const document = parse(new ArrayCursor(snippet));
        const originalCount = document.children.length;

        // Act: add a trailing BlankLine
        patch(document, [
            {
                op: 'add',
                path: '/children/-',
                value: {
                    type: 'BlankLine',
                },
            },
        ]);

        // Assert: new last node is a BlankLine, count increased by 1
        expect(document.children.length).toBe(originalCount + 1);
        const last: any = document.children[document.children.length - 1];
        expect(last.type).toBe('BlankLine');

        // Assert: render round-trip: last line is truly blank
        const rendered = renderDocument(document);
        expect(rendered[rendered.length - 1]).toBe('');
    });

    it('moves a node within children', () => {
        // Arrange: three paragraphs
        const snippet = [
            '   A',
            '',
            '   B',
            '',
            '   C',
        ];
        const document = parse(new ArrayCursor(snippet));
        const kindsBefore = document.children.map((node: any) => node.type);
        expect(kindsBefore).toEqual(['Paragraph', 'BlankLine', 'Paragraph', 'BlankLine', 'Paragraph']);

        // Act: move the last paragraph to the front
        patch(document, [
            {op: 'move', from: '/children/4', path: '/children/0'},
        ]);

        // Assert: order updated, still the same kinds
        const kindsAfter = document.children.map((node: any) => node.type);
        expect(kindsAfter).toEqual(['Paragraph', 'Paragraph', 'BlankLine', 'Paragraph', 'BlankLine']);
        const firstPara: any = document.children[0];
        expect(firstPara.type).toBe('Paragraph');
        expect(firstPara.indent).toBe(3);
        expect(firstPara.lines[0]).toBe('C');

        // Assert: render round-trip preserves moved order and indentation
        const rendered = renderDocument(document);
        expect(rendered[0]).toBe('   C');
    });

    it('removes a node via path', () => {
        // Arrange: paragraph, blank, paragraph
        const snippet = [
            '   One',
            '',
            '   Two',
        ];
        const document = parse(new ArrayCursor(snippet));
        expect(document.children.map((node: any) => node.type)).toEqual(['Paragraph', 'BlankLine', 'Paragraph']);

        // Act: remove the blank line node
        patch(document, [
            {op: 'remove', path: '/children/1'},
        ]);

        // Assert: only two paragraphs remain
        expect(document.children.map((node: any) => node.type)).toEqual(['Paragraph', 'Paragraph']);

        // Assert: render round-trip has no blank line between paragraphs
        const rendered = renderDocument(document);
        expect(rendered).toEqual(['   One', '   Two']);
    });
});
