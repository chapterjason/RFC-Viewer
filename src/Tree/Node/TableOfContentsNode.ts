import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface TableOfContentsEntry {
    raw: string;
    indent: number;
    title: string | null;
    page: number | null;
}

export interface TableOfContentsNode extends BaseTreeNode {
    type: 'TableOfContents';
    lines: string[];
    entries: TableOfContentsEntry[];
}

