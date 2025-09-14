import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface ParagraphNode extends BaseTreeNode {
    type: 'Paragraph';
    indent: number;
    lines: string[]
}
