import type {HttpResponseNode} from "../Node/HttpResponseNode.js";
import {applyIndent} from "../../Utils/ApplyIndent.js";

export function renderHttpResponse(node: HttpResponseNode): string[] {
    // Back-compat: support legacy nodes with a raw lines array
    const legacy: any = node as any;
    if (Array.isArray(legacy.lines)) {
        return [...legacy.lines];
    }

    const head = [
        ...applyIndent([node.statusLine], node.indent),
        ...applyIndent(node.headerLines, node.indent),
    ];

    if (node.bodyLines && node.bodyLines.length > 0) {
        return [...head, "", ...applyIndent(node.bodyLines, node.indent)];
    }

    return head;
}
