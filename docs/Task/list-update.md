
# List Update

There has been different issues that has to be addressed.

The Node documentation has already been updated under `docs/Node/ListItemNode.md` and `docs/Node/ListNode.md`.

## DefinitionList

The DefinitionListNode MUST be removed and migrated to ListNode and ListItemNode.
As they have the same structure.
All tests and implementation MUST be removed.

## Structure

The `ListItemNode` MUST be changed to support different NodeTypes in a new `children` property.
This also means that the `lines` property MUST be removed.
As the ListItemNode MUST be seen as part of the tree it will now need to extend the `BaseTreeNode`.
This concludes addition of a new renderer and an update for the renderer of lists.

```ts

export type ListItemChildrenType =
    ParagraphNode
    | ListNode
    | PageFooterNode
    | PageBreakNode
    | PageHeaderNode
    | BlankLineNode;

export interface ListItemNode extends BaseTreeNode {
    type: 'ListItem';
    marker: string;
    children: ListItemChildrenType[];
    contentIndent: number;
    markerIndent: number;
    markerOnly?: boolean;
}
```

The `ListNode` MUST be change to support also the `BlankLineNode`, `PageFooterNode`, `PageHeaderNode` and the `PageBreakNode`.
This means that a list CAN span over multiple pages and have blank lines between the items.
Each item in a list MUST have the same marker type, if a different marker type is used, a new list MUST be created.

```ts
export type ListItemsType =
    ListItemNode
    | BlankLineNode
    | PageFooterNode
    | PageHeaderNode
    | PageBreakNode;

export interface ListNode extends BaseTreeNode {
    type: 'List';
    items: ListItemsType[];
}
```

## Tests

The tests are currently a mess and need to be updated.
There MUST be tests to verify all the features and documentation requirements are met.
Each test MUST include a round trip to rendering to test this also.
