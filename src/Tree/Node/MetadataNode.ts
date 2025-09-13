import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface MetadataNode extends BaseTreeNode {
    type: 'Metadata';
    lines: string[];
}

