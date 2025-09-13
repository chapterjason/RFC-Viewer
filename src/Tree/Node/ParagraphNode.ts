import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface ParagraphNode extends BaseTreeNode {
    type: 'Paragraph';
    lines: string[]
}