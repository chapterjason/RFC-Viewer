import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('Numeric section title vs list', () => {
    it('parses "1. Introduction" at column 0 as a SectionTitle (not a List)', () => {
        // Arrange: heading-like numeric line at indent 0, followed by blank and body
        const snippetWithContext = [
            '',
            '1. Introduction',
            '',
            '   This is the beginning of the document body.',
        ];

        // Act
        const doc = parse(new ArrayCursor(snippetWithContext));
        const kinds = doc.children.map((n: any) => n.type);

        // Assert
        expect(kinds).toEqual(['BlankLine', 'SectionTitle', 'BlankLine', 'Paragraph']);
        const section: any = doc.children[1];
        expect(section.type).toBe('SectionTitle');
        expect(section.lines[0]).toBe('1. Introduction');
    });

    it('still parses consecutive top-level numeric items as a List', () => {
        // Arrange
        const snippet = [
            '1. First',
            '2. Second',
            '',
        ];

        // Act
        const doc = parse(new ArrayCursor(snippet));
        const kinds = doc.children.map((n: any) => n.type);

        // Assert
        expect(kinds).toEqual(['List', 'BlankLine']);
        const list: any = doc.children[0];
        expect(list.type).toBe('List');
        expect(list.items.map((i: any) => i.marker)).toEqual(['1.', '2.']);
    });
});

