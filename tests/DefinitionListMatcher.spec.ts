import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';
import type {ListItemNode} from '../src/Tree/Node/ListItemNode.js';
import type {ParagraphNode} from '../src/Tree/Node/ParagraphNode.js';
import type {ListNode} from '../src/Tree/Node/ListNode.js';
import {renderList} from '../src/Tree/Render/RenderList.js';

function getFirstListItem(list: ListNode): ListItemNode {
    const item = list.items.find((entry) => entry.type === 'ListItem') as ListItemNode | undefined;
    if (!item) {
        throw new Error('Expected list to contain a ListItem');
    }
    return item;
}

function collectParagraphText(item: ListItemNode): string[] {
    return item.children
        .filter((child): child is ParagraphNode => child.type === 'Paragraph')
        .flatMap((paragraph) => paragraph.lines);
}

describe('ListMatcher - definition style items', () => {
    it('parses a definition term with wrapped description', () => {
        // Arrange
        const lines = [
            '   client',
            '      An application making protected resource requests on behalf of the',
            '      resource owner and with its authorization.  The term "client" does',
            '      not imply any particular implementation characteristics (e.g.,',
            '      whether the application executes on a server, a desktop, or other',
            '      devices).',
        ];

        // Act
        const document = parse(new ArrayCursor(lines));
        const list = document.children[0] as ListNode;
        const item = getFirstListItem(list);

        // Assert: structure and round trip
        expect(list.type).toBe('List');
        expect(item.marker).toBe('client');
        expect(item.markerIndent).toBe(3);
        expect(item.contentIndent).toBe(6);
        expect(collectParagraphText(item)[0]).toMatch(/^An application making/);
        expect(renderList(list)).toEqual(lines);
    });

    it('keeps inline definition content on the marker line', () => {
        // Arrange
        const lines = [
            '   Token replay:  An attacker attempts to use a token that has already',
            '      been used with that resource server in the past.',
        ];

        // Act
        const document = parse(new ArrayCursor(lines));
        const list = document.children[0] as ListNode;
        const item = getFirstListItem(list);

        // Assert: inline flag and rendering
        expect(item.inline).toBe(true);
        expect(item.markerIndent).toBe(3);
        expect(item.contentIndent).toBe(6);
        expect(renderList(list)).toEqual(lines);
    });

    it('groups multiple definition terms into a single list', () => {
        // Arrange
        const lines = [
            '   client',
            '      The application...',
            '   authorization server',
            '      The server issuing access tokens...',
            '',
        ];

        // Act
        const document = parse(new ArrayCursor(lines));
        const list = document.children[0] as ListNode;
        const items = list.items.filter((entry): entry is ListItemNode => entry.type === 'ListItem');

        // Assert
        expect(items.map((entry) => entry.marker)).toEqual(['client', 'authorization server']);
        expect(renderList(list)).toEqual(lines.slice(0, -1));
    });

    it('parses OAuth token type registration fields with proper indentation', () => {
        // Arrange
        const lines = [
            '   Type name:',
            '      The name requested (e.g., "example").',
            '',
            '   Additional Token Endpoint Response Parameters:',
            '      Additional response parameters returned together with the',
            '      "access_token" parameter.  New parameters MUST be separately',
            '      registered in the OAuth Parameters registry as described by',
            '      Section 11.2.',
            '',
            '   HTTP Authentication Scheme(s):',
            '      The HTTP authentication scheme name(s), if any, used to',
            '      authenticate protected resource requests using access tokens of',
            '      this type.',
            '',
            '   Change controller:',
            '      For Standards Track RFCs, state "IETF".  For others, give the name',
            '      of the responsible party.  Other details (e.g., postal address,',
            '      email address, home page URI) may also be included.',
            '',
        ];

        // Act
        const document = parse(new ArrayCursor(lines));
        const kinds = document.children.map((child) => child.type);
        const list = document.children[0] as ListNode;
        const items = list.items.filter((entry): entry is ListItemNode => entry.type === 'ListItem');

        // Assert
        expect(kinds).toEqual(['List', 'BlankLine']);
        expect(items).toHaveLength(4);
        expect(items.map((entry) => entry.marker)).toEqual([
            'Type name:',
            'Additional Token Endpoint Response Parameters:',
            'HTTP Authentication Scheme(s):',
            'Change controller:',
        ]);
        for (const item of items) {
            expect(item.markerIndent).toBe(3);
            expect(item.contentIndent).toBe(6);
        }
        expect(collectParagraphText(items[0])[0]).toBe('The name requested (e.g., "example").');
        expect(renderList(list)).toEqual(lines.slice(0, -1));
    });

    it('creates nested lists for child definition terms', () => {
        // Arrange
        const lines = [
            '   error',
            '         REQUIRED.  A single ASCII error code from the following:',
            '         invalid_request',
            '               The request is missing a required parameter.',
            '         access_denied',
            '               The resource owner denied the request.',
        ];

        // Act
        const document = parse(new ArrayCursor(lines));
        const list = document.children[0] as ListNode;
        const item = getFirstListItem(list);
        expect(item.markerIndent).toBe(3);
        expect(item.contentIndent).toBe(9);
        const nested = item.children.find((child) => child.type === 'List') as ListNode | undefined;

        // Assert
        expect(nested).toBeDefined();
        const nestedMarkers = nested!.items
            .filter((entry): entry is ListItemNode => entry.type === 'ListItem')
            .map((entry) => entry.marker);
        expect(nestedMarkers).toEqual(['invalid_request', 'access_denied']);
    });

    it('splits lists across pagination boundaries', () => {
        // Arrange
        const lines = [
            '   error',
            '      REQUIRED.  A single ASCII error code from the following:',
            '         invalid_request',
            '               The request is missing a required parameter.',
            '',
            'Hardt                        Standards Track                   [Page 27]',
            '\f',
            'RFC 6749                        OAuth 2.0                   October 2012',
            '',
            '         unauthorized_client',
            '               The client is not authorized to request an authorization',
            '               code using this method.',
        ];

        // Act
        const document = parse(new ArrayCursor(lines));
        const kinds = document.children.map((child) => child.type);

        // Assert: first list, pagination markers, second list
        expect(kinds).toEqual(['List', 'BlankLine', 'PageFooter', 'PageBreak', 'PageHeader', 'BlankLine', 'List']);
        const firstList = document.children[0] as ListNode;
        const secondList = document.children[6] as ListNode;
        expect(getFirstListItem(firstList).marker).toBe('error');
        expect(getFirstListItem(secondList).marker).toBe('unauthorized_client');
    });
});
