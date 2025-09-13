import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import type {BlockContext} from '../src/Tree/BlockContext.js';
import {SectionTitleMatcher} from '../src/Tree/Matcher/SectionTitleMatcher.js';

function createTestContext(lines: string[]): BlockContext {
    const normalized = lines.join('\n').replace(/\r?\n/g, '\n').split('\n');
    const cursor = new ArrayCursor(normalized);
    return {
        cursor,
        peek: (offset: number) => cursor.peek(offset),
        advance: () => {
            cursor.next();
        },
        state: {seenMetadata: false, seenTitle: false},
    };
}

describe('SectionTitleMatcher', () => {
    it('parses a multi-line section title with wrapped indented continuation', () => {
        // Arrange: first line at indent 0, continuation line indented, then a blank
        const inputLines = [
            '4.5.  Client Sends the Authorization Code and the Code Verifier to the',
            '      Token Endpoint',
            '',
            '   Body text',
        ];
        const context = createTestContext(inputLines);
        const sut = SectionTitleMatcher;

        // Act
        expect(sut.test(context)).toBe(true);
        const node: any = sut.parse(context);

        // Assert
        expect(node.type).toBe('SectionTitle');
        expect(node.lines.length).toBe(2);
        expect(node.lines[0]).toBe('4.5.  Client Sends the Authorization Code and the Code Verifier to the');
        expect(node.lines[1]).toBe('      Token Endpoint');
        // Next token should be the blank line after the section title
        expect(context.peek(0)).toBe('');
    });

    it('does not match when the first line is indented', () => {
        // Arrange
        const inputLines = [
            '    Indented line should not be a section title',
            'Next line',
        ];
        const context = createTestContext(inputLines);
        const sut = SectionTitleMatcher;

        // Act & Assert
        expect(sut.test(context)).toBe(false);
    });
});
