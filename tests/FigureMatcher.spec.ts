import {describe, expect, it} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';
import {parse} from '../src/Tree/Parser.js';
import type {DocumentNode} from '../src/Tree/Node/DocumentNode.js';
import type {FigureNode} from '../src/Tree/Node/FigureNode.js';
import {renderToString} from '../src/Tree/Render/RenderToString.js';

describe('FigureMatcher', () => {
    it('parses a diagram that starts with a label-only line', () => {
        // Arrange: the diagram begins with a parenthetical label like "(B)"
        const snippet = [
            '',
            '         (B)',
            '     +----|-----+          Client Identifier      +---------------+',
            '     |         -+----(A)-- & Redirection URI ---->|               |',
            '',
        ];

        // Act: parse and locate Figure node
        const document = parse(new ArrayCursor(snippet)) as DocumentNode;
        const figures = document.children.filter(n => n.type === 'Figure') as FigureNode[];

        // Assert: exactly one figure and round-trip rendering matches
        expect(figures.length).toBe(1);
        const roundTrip = renderToString(document);
        expect(roundTrip).toBe(snippet.join('\n'));
    });
    it('parses a simple diagram with caption (Figure 1)', () => {
        // Arrange: minimal RFC-like context around a diagram and caption
        const snippet = [
            '',
            '1.2.  Protocol Flow',
            '',
            '     +--------+                               +---------------+',
            '     |        |--(A)- Authorization Request ->|   Resource    |',
            '     |        |                               |     Owner     |',
            '     |        |<-(B)-- Authorization Grant ---|               |',
            '     |        |                               +---------------+',
            '     |        |',
            '     |        |                               +---------------+',
            '     |        |--(C)-- Authorization Grant -->| Authorization |',
            '     | Client |                               |     Server    |',
            '     |        |<-(D)----- Access Token -------|               |',
            '     |        |                               +---------------+',
            '     |        |',
            '     |        |                               +---------------+',
            '     |        |--(E)----- Access Token ------>|    Resource   |',
            '     |        |                               |     Server    |',
            '     |        |<-(F)--- Protected Resource ---|               |',
            '     +--------+                               +---------------+',
            '',
            '                     Figure 1: Abstract Protocol Flow',
            '',
            'Some text after.',
        ];

        // Act: parse and locate Figure node
        const document = parse(new ArrayCursor(snippet)) as DocumentNode;
        const figures = document.children.filter(n => n.type === 'Figure') as FigureNode[];

        // Assert: exactly one figure with expected content and rendering stable
        expect(figures.length).toBe(1);
        const figure = figures[0];
        expect(figure.lines[0]).toContain('+--------+');
        expect(figure.lines[figure.lines.length - 1]).toContain('Figure 1:');

        const roundTrip = renderToString(document);
        expect(roundTrip).toBe(snippet.join('\n'));
    });

    it('parses a diagram with an intervening Note and caption (Figure 3)', () => {
        // Arrange: RFC-like snippet around the Figure 3 example
        const snippet = [
            '',
            '4.1.  Authorization Code Grant',
            '',
            '     +----------+',
            '     | Resource |',
            '     |   Owner  |',
            '     |          |',
            '     +----------+',
            '          ^',
            '          |',
            '         (B)',
            '     +----|-----+          Client Identifier      +---------------+',
            '     |         -+----(A)-- & Redirection URI ---->|               |',
            '     |  User-   |                                 | Authorization |',
            '     |  Agent  -+----(B)-- User authenticates --->|     Server    |',
            '     |          |                                 |               |',
            '     |         -+----(C)-- Authorization Code ---<|               |',
            '     +-|----|---+                                 +---------------+',
            '       |    |                                         ^      v',
            '      (A)  (C)                                        |      |',
            '       |    |                                         |      |',
            '       ^    v                                         |      |',
            '     +---------+                                      |      |',
            "     |         |>---(D)-- Authorization Code ---------\\'      |",
            '     |  Client |          & Redirection URI                  |',
            '     |         |                                             |',
            "     |         |<---(E)----- Access Token -------------------\\'",
            '     +---------+       (w/ Optional Refresh Token)',
            '',
            '   Note: The lines illustrating steps (A), (B), and (C) are broken into',
            '   two parts as they pass through the user-agent.',
            '',
            '                     Figure 3: Authorization Code Flow',
            '',
            'Next paragraph after the figure.',
        ];

        // Act: parse and locate Figure node
        const document = parse(new ArrayCursor(snippet)) as DocumentNode;
        const figures = document.children.filter(n => n.type === 'Figure') as FigureNode[];

        // Assert: we captured diagram + note + caption together and rendering matches
        expect(figures.length).toBe(1);
        const figure = figures[0];
        const figureJoined = figure.lines.join('\n');
        expect(figureJoined).toContain('Note:');
        expect(figureJoined).toMatch(/Figure\s+3:/);

        const roundTrip = renderToString(document);
        expect(roundTrip).toBe(snippet.join('\n'));
    });

    it('does not split a figure on inline annotation lines that resemble list items', () => {
        // Arrange: RFC-like snippet for Implicit Grant with an inline annotation line
        const snippet = [
            '',
            '     +----------+',
            '     | Resource |',
            '     |  Owner   |',
            '     |          |',
            '     +----------+',
            '          ^',
            '          |',
            '         (B)',
            '     +----|-----+          Client Identifier     +---------------+',
            '     |         -+----(A)-- & Redirection URI --->|               |',
            '     |  User-   |                                | Authorization |',
            '     |  Agent  -|----(B)-- User authenticates -->|     Server    |',
            '     |          |                                |               |',
            '     |          |<---(C)--- Redirection URI ----<|               |',
            '     |          |          with Access Token     +---------------+',
            '     |          |            in Fragment',
            '     |          |                                +---------------+',
            '     |          |----(D)--- Redirection URI ---->|   Web-Hosted  |',
            '     |          |          without Fragment      |     Client    |',
            '     |          |                                |    Resource   |',
            '     |     (F)  |<---(E)------- Script ---------<|               |',
            '     |          |                                +---------------+',
            '     +-|--------+',
            '       |    |',
            '       (A) (G) Access Token',
            '       |    |',
            '       ^    v',
            '     +---------+',
            '     |         |',
            '     |  Client |',
            '     |         |',
            '     +---------+',
            '',
            '   Note: The lines illustrating steps (A) and (B) are broken into two',
            '   parts as they pass through the user-agent.',
            '',
            '                       Figure 4: Implicit Grant Flow',
            '',
        ];

        // Act
        const document = parse(new ArrayCursor(snippet)) as DocumentNode;
        const figures = document.children.filter(n => n.type === 'Figure') as FigureNode[];
        const lists = document.children.filter(n => n.type === 'List');

        // Assert: single Figure that spans the whole diagram; no List extracted from annotation
        expect(figures.length).toBe(1);
        expect(lists.length).toBe(0);
        const roundTrip = renderToString(document);
        expect(roundTrip).toBe(snippet.join('\n'));
    });
});
