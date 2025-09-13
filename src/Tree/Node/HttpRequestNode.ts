import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface HttpRequestNode extends BaseTreeNode {
    type: "HttpRequest";
    lines: string[];
    bodyLines?: string[];
}

