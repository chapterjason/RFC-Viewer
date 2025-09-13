import type {AbnfNode} from "../Node/AbnfNode.js";

export function renderAbnf(node: AbnfNode): string[] {
    return [...node.lines];
}

