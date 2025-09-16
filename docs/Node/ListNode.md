
# `ListNode`

A `ListNode` groups a sequence of list-related nodes.  Most entries are [`ListItemNode`](./ListItemNode.md) instances, but blank lines and pagination markers (`PageHeader`, `PageFooter`, `PageBreak`) can appear between items to reflect RFC layouts accurately.

The parser guarantees that all `ListItemNode`s inside the same list share the same marker style.  When the marker style changes a new `ListNode` is produced, which keeps nested lists easy to reason about.  Blank lines between items are preserved as dedicated nodes so renderers can maintain the original spacing.
