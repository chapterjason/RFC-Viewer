import type {ArrayCursor} from "../Utils/ArrayCursor.js";

export interface BlockContext {
    cursor: ArrayCursor<string>;

    peek(k: number): string | null;

    advance(): void;
}