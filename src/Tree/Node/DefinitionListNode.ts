import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface DefinitionItemNode {
    termLines: string[];
    termIndent: number;
    definitionIndent: number;
    lines: string[];
    inline?: boolean;
    children?: DefinitionItemNode[];
}

export interface DefinitionListNode extends BaseTreeNode {
    type: 'DefinitionList';
    items: DefinitionItemNode[];
}
