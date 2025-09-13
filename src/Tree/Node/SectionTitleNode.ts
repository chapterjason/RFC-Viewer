import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface SectionTitleNode extends BaseTreeNode {
    type: 'SectionTitle';
    lines: string[];
}

