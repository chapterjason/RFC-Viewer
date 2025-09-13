import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface DefinitionItemNode {
    term: string;
    termIndent: number;
    definitionIndent: number;
    lines: string[];
    children?: DefinitionItemNode[];
}

export interface DefinitionListNode extends BaseTreeNode {
    type: 'DefinitionList';
    items: DefinitionItemNode[];
}
