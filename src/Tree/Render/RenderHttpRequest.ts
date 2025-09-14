import type {HttpRequestNode} from "../Node/HttpRequestNode.js";
import {applyIndent} from "../../Utils/ApplyIndent.js";

export function renderHttpRequest(node: HttpRequestNode): string[] {
    // Back-compat: some patches may provide legacy {type: 'HttpRequest', lines: string[]}
    const legacy: any = node as any;
    if (Array.isArray(legacy.lines)) {
        return [...legacy.lines];
    }
    const head = [
        ...applyIndent(node.requestLines, node.indent),
        ...applyIndent(node.headerLines, node.indent),
    ];

    if (node.bodyLines && node.bodyLines.length > 0) {
        return [...head, "", ...applyIndent(node.bodyLines, node.indent)];
    }

    return head;
}
