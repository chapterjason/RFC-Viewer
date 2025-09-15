
# `ListItemNode`

A `ListItemNode` consist of a marker and content.

Usually the marker and the content is separated by two spaces.
In some cases, as their might wasn't enough space cause of the 72 char limit, the space was reduced to one space.

## Marker

The marker CAN consist of multiple lines like from the [RFC9562] on line 1253:

```txt
   Replace Leftmost Random Bits with Increased Clock Precision
   (Method 3):
      For UUIDv7, which has millisecond timestamp precision, it is
      possible to use additional clock precision available on the system
      to substitute for up to 12 random bits immediately following the
      timestamp.  This can provide values that are time ordered with
      sub-millisecond precision, using however many bits are appropriate
      in the implementation environment.  With this method, the
      additional time precision bits MUST follow the timestamp as the
      next available bit in the rand_a field for UUIDv7.
```

For sure this can only work if the marker contains text like the [Parenthesized List Item](#parenthesized-list-item), [Bracketed List Item](#bracketed-list-item) or the  [Colon List Item](#colon-list-item).

The marker MUST be one of the following types:

### Types

#### Dashed List Item

Example:

```txt
   -  Item 1
   -  Item 2 with
      a multiline text
   -  Item 3
```

#### Starred List Item

Example:

```txt
   *  Item 1
   *  Item 2 with
      a multiline text
   *  Item 3
```

#### Bullet List Item

Example:

```txt
   o  Item 1
   o  Item 2 with
      a multiline text
   o  Item 3
```

#### Numbered List Item

Example:

```txt
   1.  Item 1
   2.  Item 2 with
       a multiline text
   3.  Item 3
```

#### Parenthesized List Item

Example:

```txt
   (a)  Item 1
   (b)  Item 2 with
        a multiline text
   (c)  Item 3
```

#### Bracketed List Item

Example:

```txt
   [1234]  Item 1
   [2345]  Item 2 with
           a multiline text
   [3456]  Item 3

   [RFC4321]  Item 4 referencing
              an RFC
   [RFC1234]
              Text is also possible on the next line
```

#### Abbreviated List Item

Example:

```txt
   ABNF  Augmented Backus-Naur Form
   DBMS  Database Management System
   MD5   Message Digest 5
```

#### Colon List Item

Example:

```txt
   Term 1:  Definition 1
   Term 2:  Definition 2 with
            a multiline text
   Term 3:  Definition 3
```

## Content

The content can be on the same line as the marker or on the next line.
The content can also span multiple lines and paragraphs.
Different types of nodes can appear in a single list item.
For example also a deeper list with items or other nodes, which have to be observed and documented here:

- ListNode
  - ListItemNode
- ParagraphNode

## Migration

For preparation I want to change from:

```ts
export interface ListItemNode {
    marker: string;
    lines: string[];
    contentIndent: number;
    markerIndent: number;
    markerOnly?: boolean;
}
```

to

```ts
import {ParagraphNode} from "./ParagraphNode";
import {ListNode} from "./ListNode";

export interface ListItemNode {
    marker: string;
    children: (ParagraphNode | ListNode)[];
    contentIndent: number;
    markerIndent: number;
    markerOnly?: boolean;
}
```


