Patch-JSON for ASTs

- Paths use JSON Pointer (e.g., `/children/0/lines/1`).
- Supported operations: `add`, `remove`, `replace`, `move`, `copy`, `test`.

Operations

- add: `{ "op": "add", "path": "/children/-", "value": <node|value> }`
  - Arrays: use `-` to append; use a numeric index to insert at a position.
  - Objects: creates or overwrites the property at the path.

- remove: `{ "op": "remove", "path": "/children/2" }`
  - Arrays: removes the element at index.
  - Objects: deletes the property.

- replace: `{ "op": "replace", "path": "/children/0/lines/0", "value": "Edited" }`
  - Path must exist; replaces the property or array element.

- move: `{ "op": "move", "from": "/children/4", "path": "/children/0" }`
  - Removes the source then performs an add into the destination.

- copy: `{ "op": "copy", "from": "/children/1", "path": "/children/-" }`
  - Deep-copies the value at `from` then adds to the destination.

- test: `{ "op": "test", "path": "/children/0/type", "value": "Paragraph" }`
  - Asserts deep equality; throws if it does not match.

Notes

- The patcher mutates the provided `DocumentNode` in place and returns it.
- To create a new node via `add`, provide an object matching the desired node shape. Positions may be synthetic if not known.
- Root-level operations on the document itself (add/replace/remove at path `""`) are disallowed.
