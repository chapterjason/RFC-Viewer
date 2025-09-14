import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import type {BlockContext} from '../src/Tree/BlockContext.js';
import {MetadataMatcher} from '../src/Tree/Matcher/MetadataMatcher.js';

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

describe('MetadataMatcher', () => {
    it('matches the first non-blank lines at the document start and parses until a blank line', () => {
        // Arrange: leading blanks, then metadata lines, then blank, then body
        const inputLines = [
            '',
            '',
            'Internet Engineering Task Force (IETF)                     D. Hardt, Ed.',
            'Request for Comments: 6749                                     Microsoft',
            'Category: Standards Track',
            '',
            'Body begins here.',
        ];
        const context = createTestContext(inputLines);
        const sut = MetadataMatcher;

        // Act: test then parse
        // Move to the first non-blank content line (skip leading blanks)
        context.advance();
        context.advance();
        const canMatch = sut.test(context);
        expect(canMatch).toBe(true);
        const node: any = sut.parse(context);

        // Assert: node shape and state
        expect(node.type).toBe('Metadata');
        expect(node.lines.length).toBe(3);
        expect(context.state.seenMetadata).toBe(true);
        // Next token should be the blank line after metadata
        expect(context.peek(0)).toBe('');
    });

    it('does not match after metadata has been seen', () => {
        // Arrange: metadata already parsed
        const inputLines = [
            'Internet Engineering Task Force (IETF)                     D. Hardt, Ed.',
            'Request for Comments: 6749                                     Microsoft',
            '',
            'Other content',
        ];
        const context = createTestContext(inputLines);
        const sut = MetadataMatcher;

        // Act: parse metadata once
        expect(sut.test(context)).toBe(true);
        sut.parse(context);

        // Assert: subsequent attempts do not match
        expect(sut.test(context)).toBe(false);
    });

    it('matches when first line is "Network Working Group" and RFC markers follow', () => {
        // Arrange: first non-blank line lacks IETF mention but is a known header starter
        const inputLines = [
            'Network Working Group                                          T. Dierks',
            'Request for Comments: 4346                                   Independent',
            'Obsoletes: 2246                                              E. Rescorla',
            'Category: Standards Track                                     RTFM, Inc.',
            '',
            'Body begins here.',
        ];
        const context = createTestContext(inputLines);
        const sut = MetadataMatcher;

        // Act
        const canMatch = sut.test(context);
        expect(canMatch).toBe(true);
        const node: any = sut.parse(context);

        // Assert
        expect(node.type).toBe('Metadata');
        expect(node.lines.length).toBe(4);
        expect(context.state.seenMetadata).toBe(true);
        expect(context.peek(0)).toBe('');
    });

    it('matches additional known sources at the top of the document', () => {
        // Arrange: try several valid header sources
        const sources = [
            'Internet Engineering Task Force (IETF)',
            'Internet Architecture Board (IAB)',
            'Internet Research Task Force (IRTF)',
            'Independent Submission',
        ];
        const sut = MetadataMatcher;

        for (const source of sources) {
            const inputLines = [
                `${source}                                         Example Author`,
                'Request for Comments: 9999                              Example Org',
                'Category: Informational',
                '',
                'Body begins here.',
            ];
            const context = createTestContext(inputLines);

            // Act
            const canMatch = sut.test(context);
            expect(canMatch).toBe(true);
            const node: any = sut.parse(context);

            // Assert
            expect(node.type).toBe('Metadata');
            expect(node.lines.length).toBe(3);
            expect(context.state.seenMetadata).toBe(true);
            expect(context.peek(0)).toBe('');
        }
    });
});
