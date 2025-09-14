import type {DocumentNode} from "../Node/DocumentNode.js";
import type {PatchDocument} from "./PatchDocument.js";

// Patch-JSON format (inspired by RFC 6902 JSON Patch) specialized for ASTs
// - Paths use JSON Pointer syntax (e.g., "/children/0/lines/1").
// - Supported operations: add, remove, replace, move, copy, test.
// - For add: when targeting an array, the final path token may be "-" to append.
// - For add with an array path, the token may be a numeric string to insert at index.
// - For remove: removes the property or the array element at the path.
// - For replace: replaces the property value or array element; path must exist.
// - For move: removes the value from "from" and performs an add at "path".
// - For copy: deep-copies the value at "from" and performs an add at "path".
// - For test: deep-equality assertion of the current value at path.

export function patch(document: DocumentNode, patch: PatchDocument): DocumentNode {
    // By default we mutate the given document for predictability and performance.
    // Callers that need immutability can deep-clone before calling applyPatch.
    for (const operation of patch) {
        switch (operation.op) {
            case 'add': {
                addAtPointer(document as unknown as any, operation.path, deepCopy(operation.value));
                break;
            }
            case 'remove': {
                removeAtPointer(document as unknown as any, operation.path);
                break;
            }
            case 'replace': {
                replaceAtPointer(document as unknown as any, operation.path, deepCopy(operation.value));
                break;
            }
            case 'move': {
                const value = getAtPointer(document as unknown as any, operation.from);
                removeAtPointer(document as unknown as any, operation.from);
                addAtPointer(document as unknown as any, operation.path, value);
                break;
            }
            case 'copy': {
                const value = getAtPointer(document as unknown as any, operation.from);
                addAtPointer(document as unknown as any, operation.path, deepCopy(value));
                break;
            }
            case 'test': {
                const actual = getAtPointer(document as unknown as any, operation.path);
                if (!deepEqual(actual, operation.value)) {
                    throw new Error(`Patch test failed at path ${operation.path}`);
                }
                break;
            }
            default: {
                // Exhaustive check
                const neverOp: never = operation;
                throw new Error(`Unsupported patch operation: ${(neverOp as any)?.op}`);
            }
        }
    }
    return document;
}

function deepCopy<T>(value: T): T {
    // Prefer structuredClone when available (Node 18+), fallback to JSON clone
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof structuredClone === 'function') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as T;
}

function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) {
        return true;
    }
    if (typeof a !== typeof b) {
        return false;
    }
    if (a === null || b === null) {
        return a === b;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }
        for (let index = 0; index < a.length; index++) {
            if (!deepEqual(a[index], b[index])) {
                return false;
            }
        }
        return true;
    }
    if (typeof a === 'object' && typeof b === 'object') {
        const aKeys = Object.keys(a as Record<string, unknown>);
        const bKeys = Object.keys(b as Record<string, unknown>);
        if (aKeys.length !== bKeys.length) {
            return false;
        }
        for (const key of aKeys) {
            if (!Object.prototype.hasOwnProperty.call(b as object, key)) {
                return false;
            }
            if (!deepEqual((a as any)[key], (b as any)[key])) {
                return false;
            }
        }
        return true;
    }
    return false;
}

function parsePointer(path: string): string[] {
    if (path === '') {
        return [];
    }
    if (!path.startsWith('/')) {
        throw new Error(`Invalid JSON Pointer: ${path}`);
    }
    // Split and unescape per JSON Pointer spec
    return path
        .split('/')
        .slice(1)
        .map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function getContainerAndToken(root: any, path: string): { container: any, token: string } {
    const tokens = parsePointer(path);
    if (tokens.length === 0) {
        return {container: null, token: ''};
    }
    let target = root;
    for (let index = 0; index < tokens.length - 1; index++) {
        const maybeToken = tokens[index];
        if (maybeToken === undefined) {
            throw new Error(`Invalid path traversal at segment ${index} for ${path}`);
        }
        const token = maybeToken;
        if (Array.isArray(target)) {
            const arrayIndex = parseArrayIndex(token, target.length, /*allowEnd*/ false);
            target = target[arrayIndex];
        } else {
            if (!Object.prototype.hasOwnProperty.call(target, token)) {
                throw new Error(`Path not found: ${path}`);
            }
            target = target[token];
        }
    }
    const lastToken = tokens[tokens.length - 1]!;
    return {container: target, token: lastToken};
}

function getAtPointer(root: any, path: string): any {
    if (path === '') {
        return root;
    }
    const {container, token} = getContainerAndToken(root, path);
    if (container === null) {
        return root;
    }
    if (Array.isArray(container)) {
        const arrayIndex = parseArrayIndex(token, container.length, /*allowEnd*/ false);
        return container[arrayIndex];
    }
    if (!Object.prototype.hasOwnProperty.call(container, token)) {
        throw new Error(`Path not found: ${path}`);
    }
    return container[token];
}

function replaceAtPointer(root: any, path: string, value: unknown): void {
    if (path === '') {
        throw new Error('Replacing the root document is not supported');
    }
    const {container, token} = getContainerAndToken(root, path);
    if (Array.isArray(container)) {
        const arrayIndex = parseArrayIndex(token, container.length, /*allowEnd*/ false);
        container[arrayIndex] = value;
        return;
    }
    if (!Object.prototype.hasOwnProperty.call(container, token)) {
        throw new Error(`Path not found for replace: ${path}`);
    }
    container[token] = value;
}

function addAtPointer(root: any, path: string, value: unknown): void {
    if (path === '') {
        throw new Error('Adding at the root document is not supported');
    }
    const {container, token} = getContainerAndToken(root, path);
    if (Array.isArray(container)) {
        if (token === '-') {
            container.push(value);
            return;
        }
        const arrayIndex = parseArrayIndex(token, container.length + 1, /*allowEnd*/ true);
        // Insert at index (including at end)
        container.splice(arrayIndex, 0, value);
        return;
    }
    // Objects: simple assignment (creates the property if missing)
    container[token] = value;
}

function removeAtPointer(root: any, path: string): void {
    if (path === '') {
        throw new Error('Removing the root document is not supported');
    }
    const {container, token} = getContainerAndToken(root, path);
    if (Array.isArray(container)) {
        const arrayIndex = parseArrayIndex(token, container.length, /*allowEnd*/ false);
        container.splice(arrayIndex, 1);
        return;
    }
    if (!Object.prototype.hasOwnProperty.call(container, token)) {
        throw new Error(`Path not found for remove: ${path}`);
    }
    delete container[token];
}

function parseArrayIndex(token: string, length: number, allowEnd: boolean): number {
    if (!/^\d+$/.test(token)) {
        throw new Error(`Expected array index token, got: ${token}`);
    }
    const index = Number.parseInt(token, 10);
    const max = allowEnd ? length : length - 1;
    if (index < 0 || index > max) {
        const boundText = allowEnd ? `0..${length}` : `0..${length - 1}`;
        throw new Error(`Array index out of bounds: ${index} (valid: ${boundText})`);
    }
    return index;
}
