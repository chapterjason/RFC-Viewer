import type {BaseTreeNode} from "./BaseTreeNode.js";

export interface HttpRequestNode extends BaseTreeNode {
    type: "HttpRequest";
    indent: number;
    requestLines: string[];
    headerLines: string[];
    bodyLines?: string[];
}
