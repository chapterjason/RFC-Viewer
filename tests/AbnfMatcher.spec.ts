import {describe, it, expect} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';

describe('AbnfMatcher', () => {
    it('parses a simple ABNF block with multiple rules and continuations', () => {
        // Arrange: ABNF snippet similar to RFC 6749 Appendix A
        const lines = [
            'Introduction and context before...',
            '',
            '   Some of the definitions that follow use these common definitions:',
            '',
            '     VSCHAR     = %x20-7E',
            '     NQCHAR     = %x21 / %x23-5B / %x5D-7E',
            '     NQSCHAR    = %x20-21 / %x23-5B / %x5D-7E',
            '     UNICODECHARNOCRLF = %x09 /%x20-7E / %x80-D7FF /',
            '                         %xE000-FFFD / %x10000-10FFFF',
            '',
            'After ABNF block...',
        ].join('\n').replace(/\r?\n/g, '\n').split('\n');

        const cursor = new ArrayCursor(lines);

        // Act: parse the document
        const document = parse(cursor);

        // Assert: find an Abnf node with exact lines preserved
        const abnf = document.children.find(n => n.type === 'Abnf') as any;
        expect(abnf).toBeTruthy();
        expect(abnf.lines).toEqual([
            '     VSCHAR     = %x20-7E',
            '     NQCHAR     = %x21 / %x23-5B / %x5D-7E',
            '     NQSCHAR    = %x20-21 / %x23-5B / %x5D-7E',
            '     UNICODECHARNOCRLF = %x09 /%x20-7E / %x80-D7FF /',
            '                         %xE000-FFFD / %x10000-10FFFF',
        ]);
    });

    it('does not misclassify normal paragraphs containing equal signs', () => {
        // Arrange
        const lines = [
            'Here x = y is an inline expression in prose, not ABNF.',
            'And another line without special tokens.',
        ].join('\n').replace(/\r?\n/g, '\n').split('\n');
        const cursor = new ArrayCursor(lines);

        // Act
        const document = parse(cursor);

        // Assert: everything is a Paragraph
        expect(document.children.every(n => n.type === 'Paragraph')).toBe(true);
    });
});

