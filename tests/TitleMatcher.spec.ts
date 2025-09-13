import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import type {BlockContext} from '../src/Tree/BlockContext.js';
import {TitleMatcher} from '../src/Tree/Matcher/TitleMatcher.js';

function createTestContext(lines: string[], seenMetadata = true, seenTitle = false): BlockContext {
    const normalized = lines.join('\n').replace(/\r?\n/g, '\n').split('\n');
    const cursor = new ArrayCursor(normalized);
    return {
        cursor,
        peek: (offset: number) => cursor.peek(offset),
        advance: () => {
            cursor.next();
        },
        state: {seenMetadata, seenTitle},
    };
}

describe('TitleMatcher', () => {
    it('parses a multi-line centered title following metadata', () => {
        // Arrange: assume metadata already parsed; title is two centered lines
        const inputLines = [
            '   First Title Line',
            '     Second Title Line',
            '',
            'Body follows',
        ];
        const context = createTestContext(inputLines, true, false);
        const sut = TitleMatcher;

        // Act: test then parse
        const canMatch = sut.test(context);
        expect(canMatch).toBe(true);
        const node: any = sut.parse(context);

        // Assert: node shape and state
        expect(node.type).toBe('Title');
        expect(node.lines.length).toBe(2);
        expect(node.lines[0].trim()).toBe('First Title Line');
        expect(node.lines[1].trim()).toBe('Second Title Line');
        expect(context.state.seenTitle).toBe(true);
        // Next token should be the blank line after title
        expect(context.peek(0)).toBe('');
    });

    it('does not match when metadata has not been seen', () => {
        // Arrange: metadata missing
        const inputLines = [
            '    Centered Title',
            '',
        ];
        const context = createTestContext(inputLines, false, false);
        const sut = TitleMatcher;

        // Act & Assert: cannot match
        expect(sut.test(context)).toBe(false);
    });

    it('does not match again after a title has been parsed', () => {
        // Arrange
        const inputLines = [
            '   Title Line',
            '',
            'More text',
        ];
        const context = createTestContext(inputLines, true, false);
        const sut = TitleMatcher;

        // Act: parse once
        expect(sut.test(context)).toBe(true);
        sut.parse(context);

        // Assert: no further matches
        expect(sut.test(context)).toBe(false);
    });
});

