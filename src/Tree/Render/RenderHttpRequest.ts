import type {HttpRequestNode} from "../Node/HttpRequestNode.js";

export function renderHttpRequest(node: HttpRequestNode): string[] {
    if (node.bodyLines && node.bodyLines.length > 0) {
        return [...node.lines, "", ...node.bodyLines];
    }
    return [...node.lines];
}

