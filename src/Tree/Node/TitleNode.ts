import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface TitleNode extends BaseTreeNode {
    type: 'Title';
    indent: number;
    lines: string[];
}
