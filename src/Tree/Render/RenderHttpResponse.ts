import type {HttpResponseNode} from "../Node/HttpResponseNode.js";

export function renderHttpResponse(node: HttpResponseNode): string[] {
    if (node.bodyLines && node.bodyLines.length > 0) {
        return [...node.lines, "", ...node.bodyLines];
    }
    return [...node.lines];
}
