import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface TableNode extends BaseTreeNode {
    type: "Table";
    // Indent to apply when rendering (do not emit spaces on blank lines)
    indent: number;
    // Lines include the table grid and any internal blank lines and optional caption line(s),
    // all trimmed by `indent` spaces.
    lines: string[];
}

