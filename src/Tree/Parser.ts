import type {ArrayCursor} from "../Utils/ArrayCursor.js";
import type {Position} from "./Position.js";
import type {Range} from "./Range.js";
import type {ParagraphNode} from "./Node/ParagraphNode.js";
import type {DocumentNode} from "./Node/DocumentNode.js";
import type {TreeNode} from "./Node/TreeNode.js";
import {IndentedBlockMatcher} from "./Matcher/IndentedBlockMatcher.js";
import {ParagraphMatcher} from "./Matcher/ParagraphMatcher.js";
import {BlankLineMatcher} from "./Matcher/BlankLineMatcher.js";
import {MetadataMatcher} from "./Matcher/MetadataMatcher.js";
import {TitleMatcher} from "./Matcher/TitleMatcher.js";
import type {BlockContext} from "./BlockContext.js";
import type {BlockMatcher} from "./BlockMatcher.js";
import type {ParserOptions} from "./ParserOptions.js";
import type {ParserState} from "./ParserState.js";

export const getIndentation = (line: string) => {
    const m = line.match(/^\s*/);
    return m ? m[0].length : 0
};
export const sliceLineText = (line: string, n: number) => line.slice(Math.min(n, line.length));

export function makePosition(cursor: ArrayCursor<string>, column = 0): Position {
    return {
        line: cursor.getIndex(),
        column,
        offset: null,
    }
}

export function rangeFrom(
    cursor: ArrayCursor<string>,
    startColumn: number,
    endLine: number = cursor.getIndex(),
    endColumn: number = cursor.getLength() - 1,
): Range {
    return {
        start: makePosition(cursor, startColumn),
        end: {line: endLine, column: endColumn, offset: null},
    }
}

function createContext(cursor: ArrayCursor<string>, state: ParserState): BlockContext {
    return {
        cursor,
        peek: (offset: number) => cursor.peek(offset),
        advance: () => {
            cursor.next();
        },
        state,
    };
}

export function parse(cursor: ArrayCursor<string>, options: ParserOptions = {}): DocumentNode {
    const state: ParserState = { seenMetadata: false, seenTitle: false };
    const builtInMatchers: BlockMatcher[] = [
        MetadataMatcher,
        BlankLineMatcher,
        TitleMatcher,
        IndentedBlockMatcher,
        ParagraphMatcher,
    ];

    const customMatchers = options.matchers ?? [];
    const allMatchers = [...customMatchers, ...builtInMatchers].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

    const children: TreeNode[] = [];
    const context = createContext(cursor, state);

    while (!cursor.isEOL()) {
        let matched: BlockMatcher | null = null;
        for (const matcher of allMatchers) {
            if (matcher.test(context)) {
                matched = matcher;
                break;
            }
        }

        if (!matched) {
            const start = makePosition(cursor, 0);
            const line = context.peek(0);
            children.push({
                type: "Paragraph",
                lines: line ? [line] : [],
                position: {start, end: makePosition(cursor, 0)}
            } as ParagraphNode);
            cursor.next();
            continue;
        }

        const node = matched.parse(context);
        children.push(node);
    }

    return {
        type: "Document",
        children,
        position: {start: {line: 0, column: 0, offset: null}, end: makePosition(cursor, 0)},
    };
}
