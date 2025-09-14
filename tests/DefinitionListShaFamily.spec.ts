import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';
import {DefinitionListNode} from "../src/Tree/Node/DefinitionListNode";

describe('DefinitionListMatcher - SHA family mixed inline and wrapped', () => {
    it('parses inline and wrapped definition items without falling back to Paragraph', () => {
        // Arrange: SHA entries mixing inline single-line items and wrapped descriptions
        const lines = [
            '   SHA           Secure Hash Algorithm',
            '',
            '   SHA-1         Secure Hash Algorithm 1 (with message digest of 160',
            '                 bits)',
            '',
            '   SHA-3         Secure Hash Algorithm 3 (arbitrary size)',
            '',
            '   SHA-224       Secure Hash Algorithm 2 with message digest size of 224',
            '                 bits',
            '',
            '   SHA-256       Secure Hash Algorithm 2 with message digest size of 256',
            '                 bits',
            '',
            '   SHA-512       Secure Hash Algorithm 2 with message digest size of 512',
            '                 bits',
            '',
            '   SHAKE         Secure Hash Algorithm 3 based on the KECCAK algorithm',
        ];

        // Act
        const document = parse(new ArrayCursor(lines));
        const kinds = document.children.map((n: any) => n.type);

        // Assert: alternating DefinitionList and BlankLine, no Paragraph nodes
        expect(kinds).toEqual([
            'DefinitionList', 'BlankLine',
            'DefinitionList', 'BlankLine',
            'DefinitionList', 'BlankLine',
            'DefinitionList', 'BlankLine',
            'DefinitionList', 'BlankLine',
            'DefinitionList', 'BlankLine',
            'DefinitionList',
        ]);
        // Inline single-line items detected (term + two spaces + text)
        const first: DefinitionListNode = document.children[0];
        expect(first.items[0].termLines).toEqual(['SHA']);
        expect(first.items[0].inline).toBe(true);
        expect(first.items[0].lines[0]).toBe('Secure Hash Algorithm');

        const third: DefinitionListNode = document.children[4];
        expect(third.items[0].termLines).toEqual(['SHA-3']);
        expect(third.items[0].inline).toBe(true);
        expect(third.items[0].lines[0]).toContain('Secure Hash Algorithm 3');

        const last: DefinitionListNode = document.children[12];
        expect(last.items[0].termLines).toEqual(['SHAKE']);
        expect(last.items[0].inline).toBe(true);
        expect(last.items[0].lines[0]).toContain('KECCAK');

        // Wrapped two-line items preserve continuation under computed definitionIndent
        const second: DefinitionListNode = document.children[2];
        expect(second.items[0].termLines[0].startsWith('SHA-1')).toBe(true);
        expect(second.items[0].lines).toContain('bits)');

        const fourth: DefinitionListNode = document.children[6];
        expect(fourth.items[0].termLines[0].startsWith('SHA-224')).toBe(true);
        expect(fourth.items[0].lines).toContain('bits');
    });
});

