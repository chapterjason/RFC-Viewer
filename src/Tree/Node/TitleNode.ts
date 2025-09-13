import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface TitleNode extends BaseTreeNode {
    type: 'Title';
    lines: string[];
}
