import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import type {BlockContext} from '../src/Tree/BlockContext.js';
import {PageBreakMatcher} from '../src/Tree/Matcher/PageBreakMatcher.js';

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

describe('PageBreakMatcher', () => {
    it('matches and parses a single form-feed page break', () => {
        // Arrange
        const inputLines = [
            'First paragraph line',
            '\f',
            'Second paragraph line',
        ];
        const context = createTestContext(inputLines);
        const sut = PageBreakMatcher;

        // Act & Assert: skip first paragraph line
        expect(sut.test(context)).toBe(false);
        context.advance();
        expect(sut.test(context)).toBe(true);
        const node: any = sut.parse(context);

        // Assert
        expect(node.type).toBe('PageBreak');
        expect(context.peek(0)).toBe('Second paragraph line');
    });

    it('does not match when no form-feed is present', () => {
        const context = createTestContext(['No page breaks here']);
        const sut = PageBreakMatcher;
        expect(sut.test(context)).toBe(false);
    });
});

