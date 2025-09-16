import type {ArrayCursor} from "../Utils/ArrayCursor.js";
import type {ParagraphNode} from "./Node/ParagraphNode.js";
import type {DocumentNode} from "./Node/DocumentNode.js";
import type {TreeNode} from "./Node/TreeNode.js";
import {IndentedBlockMatcher} from "./Matcher/IndentedBlockMatcher.js";
import {ParagraphMatcher} from "./Matcher/ParagraphMatcher.js";
import {BlankLineMatcher} from "./Matcher/BlankLineMatcher.js";
import {MetadataMatcher} from "./Matcher/MetadataMatcher.js";
import {TitleMatcher} from "./Matcher/TitleMatcher.js";
import {SectionTitleMatcher} from "./Matcher/SectionTitleMatcher.js";
import {PageBreakMatcher} from "./Matcher/PageBreakMatcher.js";
import {PageFooterMatcher} from "./Matcher/PageFooterMatcher.js";
import {PageHeaderMatcher} from "./Matcher/PageHeaderMatcher.js";
import {ListMatcher} from "./Matcher/ListMatcher.js";
import {TableOfContentsMatcher} from "./Matcher/TableOfContentsMatcher.js";
import {FigureMatcher} from "./Matcher/FigureMatcher.js";
import {HttpResponseMatcher} from "./Matcher/HttpResponseMatcher.js";
import {HttpRequestMatcher} from "./Matcher/HttpRequestMatcher.js";
import {AbnfMatcher} from "./Matcher/AbnfMatcher.js";
import {TableMatcher} from "./Matcher/TableMatcher.js";
import type {BlockContext} from "./BlockContext.js";
import type {BlockMatcher} from "./BlockMatcher.js";
import type {ParserOptions} from "./ParserOptions.js";
import type {ParserState} from "./ParserState.js";
import {PaketDiagramMatcher} from "./Matcher/PaketDiagramMatcher.js";

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
    const state: ParserState = {seenMetadata: false, seenTitle: false};
    const builtInMatchers: BlockMatcher[] = [
        MetadataMatcher,
        PageFooterMatcher,
        PageBreakMatcher,
        PageHeaderMatcher,
        BlankLineMatcher,
        FigureMatcher,
        TableMatcher,
        PaketDiagramMatcher,
        TitleMatcher,
        SectionTitleMatcher,
        TableOfContentsMatcher,
        ListMatcher,
        HttpRequestMatcher,
        HttpResponseMatcher,
        AbnfMatcher,
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
            const line = context.peek(0);
            children.push({
                type: "Paragraph",
                lines: line ? [line] : [],
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
    };
}
