import {isBlankLine} from "../../Utils/IsBlankLine.js";
import type {TitleNode} from "../Node/TitleNode.js";
import type {BlockMatcher} from "../BlockMatcher.js";
import {getIndentation} from "../../Utils/GetIndentation.js";
import {getCommonIndentation} from "../../Utils/GetCommonIndentation.js";
import {sliceLineText} from "../../Utils/SliceLineText.js";

export const TitleMatcher: BlockMatcher = {
    name: "title",
    priority: 20,
    test: (context) => {
        const seenMetadata = Boolean(context.state.seenMetadata);
        const seenTitle = Boolean(context.state.seenTitle);

        if (!seenMetadata || seenTitle) {
            return false;
        }

        const line = context.peek(0);

        if (line === null) {
            return false;
        }

        // Require a non-blank line with some indentation (centered)
        if (isBlankLine(line)) {
            return false;
        }

        if (getIndentation(line) < 2) {
            return false;
        }

        return true;
    },
    parse: (context) => {
        const rawLines: string[] = [];
        while (!context.cursor.isEOL()) {
            const current = context.peek(0);

            if (current === null) {
                break;
            }

            if (isBlankLine(current)) {
                break;
            }

            rawLines.push(current);
            context.advance();
        }

        const base = getCommonIndentation(rawLines);
        const lines = rawLines.map((s) => sliceLineText(s, base));

        context.state.seenTitle = true;

        return {
            type: "Title",
            indent: base,
            lines,
        } as TitleNode;
    },
};
