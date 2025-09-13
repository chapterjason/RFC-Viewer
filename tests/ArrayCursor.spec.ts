import {describe, expect, it, vi} from 'vitest';
import {ArrayCursor} from '../src/Utils/ArrayCursor.js';

describe('ArrayCursor', () => {
    it('basic navigation: current, next, isEOL, hasNext', () => {
        // Arrange: cursor with three items
        const cursor = new ArrayCursor(["a", "b", "c"]);
        // Assert: initial state
        expect(cursor.isEOL()).toBe(false);
        expect(cursor.hasNext()).toBe(true);
        expect(cursor.getIndex()).toBe(0);
        expect(cursor.current()).toBe("a");
        // Act: advance using next
        expect(cursor.next()).toBe("a"); // returns current, then advances
        expect(cursor.getIndex()).toBe(1);
        expect(cursor.current()).toBe("b");
        // Act: consume remaining
        cursor.next(); // consume b
        cursor.next(); // consume c
        // Assert: reached end
        expect(cursor.isEOL()).toBe(true);
        expect(cursor.hasNext()).toBe(false);
    });

    it('throws on next() at EOL', () => {
        // Arrange: single-item cursor
        const cursor = new ArrayCursor([1]);
        cursor.next();
        // Act & Assert: next() throws at EOL
        expect(() => cursor.next()).toThrowError('End of cursor');
    });

    it('prev and hasPrev move backward correctly', () => {
        // Arrange: three-item cursor advanced twice
        const cursor = new ArrayCursor([10, 20, 30]);
        cursor.next(); // 10, index=1
        cursor.next(); // 20, index=2
        expect(cursor.hasPrev()).toBe(true);
        // Act: move back one element
        const prevValue = cursor.prev();
        // Assert
        expect(prevValue).toBe(20);
        expect(cursor.getIndex()).toBe(1);
        // Act: move back to start
        expect(cursor.prev()).toBe(10);
        expect(cursor.getIndex()).toBe(0);
        // Act & Assert: prev at start throws
        expect(() => cursor.prev()).toThrowError('Start of cursor');
    });

    it('peek returns values in bounds and null out of bounds', () => {
        // Arrange: two-item cursor
        const sut = new ArrayCursor(["x", "y"]);
        // Act
        const head = sut.peek();
        const at0 = sut.peek(0);
        const at1 = sut.peek(1);
        const at2 = sut.peek(2);
        const atNeg = sut.peek(-1);
        // Assert
        expect(head).toBe("x");
        expect(at0).toBe("x");
        expect(at1).toBe("y");
        expect(at2).toBeNull();
        expect(atNeg).toBeNull();
        // Act: advance to index 1
        sut.next();
        // Assert
        expect(sut.peek(0)).toBe("y");
        expect(sut.peek(1)).toBeNull();
    });

    it('current throws at EOL', () => {
        // Arrange: single-item cursor
        const cursor = new ArrayCursor(["only"]);
        cursor.next();
        // Act & Assert: current() throws at EOL
        expect(() => cursor.current()).toThrowError('End of cursor');
    });

    it('remaining and consumed return correct slices', () => {
        // Arrange: four-item cursor
        const cursor = new ArrayCursor([1, 2, 3, 4]);
        // Act: consume 1
        cursor.next();
        // Assert
        expect(cursor.consumed().toArray()).toEqual([1]);
        expect(cursor.remaining().toArray()).toEqual([2, 3, 4]);
        // Act: consume 2
        cursor.next();
        // Assert
        expect(cursor.consumed().toArray()).toEqual([1, 2]);
        expect(cursor.remaining().toArray()).toEqual([3, 4]);
    });

    it('readWhile reads while predicate holds and advances cursor', () => {
        // Arrange: cursor with values less and greater than 3
        const sut = new ArrayCursor([1, 2, 3, 1, 0]);
        // Act
        const read = sut.readWhile((value) => (value as number) < 3);
        // Assert
        expect(read.toArray()).toEqual([1, 2]);
        expect(sut.current()).toBe(3);
    });

    it('readAmount reads up to amount and stops on EOL', () => {
        // Arrange: three-item cursor
        const cursor = new ArrayCursor(["a", "b", "c"]);
        const two = cursor.readAmount(2);
        // Assert
        expect(two.toArray()).toEqual(["a", "b"]);
        expect(cursor.current()).toBe("c");
        // Act: request more than remaining
        const more = cursor.readAmount(5);
        // Assert
        expect(more.toArray()).toEqual(["c"]);
        expect(cursor.isEOL()).toBe(true);
    });

    it('readAmount reads exactly remaining when amount equals remaining', () => {
        // Arrange: two-item cursor
        const sut = new ArrayCursor(["k", "l"]);
        // Act
        const both = sut.readAmount(2);
        // Assert
        expect(both.toArray()).toEqual(["k", "l"]);
        expect(sut.isEOL()).toBe(true);
    });

    it('skip can move forward and backward', () => {
        // Arrange: four-item cursor
        const cursor = new ArrayCursor(["a", "b", "c", "d"]);
        cursor.skip(2);
        // Assert
        expect(cursor.current()).toBe("c");
        cursor.skip(-1);
        // Assert
        expect(cursor.current()).toBe("b");
    });

    it('skip throws on out-of-bounds moves', () => {
        // Arrange: two-item cursor
        const cursor = new ArrayCursor(["x", "y"]);
        // Act & Assert: invalid backward skip throws
        expect(() => cursor.skip(-1)).toThrowError('Index out of bounds');
        cursor.setIndex(2); // EOL is allowed
        // Act & Assert: skip past EOL throws
        expect(() => cursor.skip(1)).toThrowError('Index out of bounds');
    });

    it('slice returns a new cursor over sliced items', () => {
        // Arrange: five-item cursor
        const cursor = new ArrayCursor([0, 1, 2, 3, 4]);
        const sliced = cursor.slice(1, 4);
        // Assert
        expect(sliced.toArray()).toEqual([1, 2, 3]);
        expect(cursor.getIndex()).toBe(0);
    });

    it('map and forEach operate over items', () => {
        // Arrange: three-item cursor
        const sut = new ArrayCursor([1, 2, 3]);
        const mapped = sut.map((n) => n * 2);
        // Assert
        expect(mapped.toArray()).toEqual([2, 4, 6]);
        // Act
        const spy = vi.fn();
        sut.forEach(spy);
        // Assert
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy).toHaveBeenNthCalledWith(1, 1, 0, [1, 2, 3]);
        expect(spy).toHaveBeenNthCalledWith(2, 2, 1, [1, 2, 3]);
        expect(spy).toHaveBeenNthCalledWith(3, 3, 2, [1, 2, 3]);
    });

    it('index and length getters/setters behave as expected', () => {
        // Arrange: two-item cursor
        const sut = new ArrayCursor(["a", "b"]);
        // Assert
        expect(sut.getIndex()).toBe(0);
        expect(sut.getLength()).toBe(2);
        // Act
        sut.setIndex(1);
        // Assert
        expect(sut.current()).toBe("b");
        // Act
        sut.setIndex(2);
        // Assert
        expect(sut.isEOL()).toBe(true);
        // Act & Assert: current() throws at EOL
        expect(() => sut.current()).toThrowError('End of cursor');
    });

    it('setIndex throws on negative or beyond length', () => {
        // Arrange: single-item cursor
        const sut = new ArrayCursor([0]);
        // Act & Assert: invalid indices throw
        expect(() => sut.setIndex(-1)).toThrowError('Index out of bounds');
        expect(() => sut.setIndex(2)).toThrowError('Index out of bounds');
    });

    it('toArray, findIndex, validate', () => {
        // Arrange: three strings
        const cursor = new ArrayCursor(["alpha", "beta", "gamma"]);
        expect(cursor.toArray()).toEqual(["alpha", "beta", "gamma"]);
        expect(cursor.findIndex((s) => s.startsWith('b'))).toBe(1);
        expect(cursor.validate((s) => s.length >= 4)).toBe(true);
        expect(cursor.validate((s) => s.startsWith('a'))).toBe(false);
    });

    it('includes, instanceOf, includesInstanceOf', () => {
        // Arrange: numbers, dates, mixed instances
        const numbers = new ArrayCursor([1, 2, 3]);
        // Act
        const actualIncludes2 = numbers.includes(2);
        const actualIncludes4 = numbers.includes(4);
        // Assert
        expect(actualIncludes2).toBe(true);
        expect(actualIncludes4).toBe(false);

        const dates = [new Date(0), new Date(1)];
        const dateCursor = new ArrayCursor(dates);
        expect(dateCursor.instanceOf(Date)).toBe(true);
        expect(dateCursor.includesInstanceOf(Date)).toBe(true);

        const mixed = new ArrayCursor<any>([new Date(), {}]);
        expect(mixed.instanceOf(Date)).toBe(false);
        expect(mixed.includesInstanceOf(Date)).toBe(true);
    });

    it('iterator consumes the cursor', () => {
        // Arrange: two-item cursor
        const sut = new ArrayCursor(["x", "y"]);
        // Act
        const seen: string[] = [];
        for (const v of sut) {
            seen.push(v);
        }
        // Assert
        expect(seen).toEqual(["x", "y"]);
        expect(sut.isEOL()).toBe(true);
    });

    it('iterator yields remaining when not at start', () => {
        // Arrange: three-item cursor advanced once
        const sut = new ArrayCursor(["u", "v", "w"]);
        // Act: consume one then iterate
        sut.next();
        const seen: string[] = [];
        for (const v of sut) {
            seen.push(v);
        }
        // Assert
        expect(seen).toEqual(["v", "w"]);
        expect(sut.isEOL()).toBe(true);
    });

    it('stream yields remaining items and advances', () => {
        // Arrange: three-item cursor advanced once
        const sut = new ArrayCursor(["a", "b", "c"]);
        // Act: consume one and stream
        sut.next();
        const seen: string[] = [];
        for (const v of sut.stream()) {
            seen.push(v);
        }
        // Assert
        expect(seen).toEqual(["b", "c"]);
        expect(sut.isEOL()).toBe(true);
    });

    it('print does not throw', () => {
        // Arrange: two-item cursor and spied console.dir
        const sut = new ArrayCursor([1, 2]);
        const dirSpy = vi.spyOn(console, 'dir').mockImplementation(() => {
        });
        expect(() => sut.print()).not.toThrow();
        expect(dirSpy).toHaveBeenCalled();
        dirSpy.mockRestore();
    });

    it('reset returns index to 0', () => {
        // Arrange: three-item cursor advanced to index 2
        const sut = new ArrayCursor([1, 2, 3]);
        sut.readAmount(2); // advance to index 2
        expect(sut.getIndex()).toBe(2);
        sut.reset();
        expect(sut.getIndex()).toBe(0);
        expect(sut.current()).toBe(1);
    });

    it('handles empty arrays safely', () => {
        // Arrange: empty cursor
        const sut = new ArrayCursor<any>([]);
        expect(sut.isEOL()).toBe(true);
        expect(sut.hasNext()).toBe(false);
        expect(sut.peek()).toBeNull();
        expect(sut.remaining().toArray()).toEqual([]);
        expect(sut.consumed().toArray()).toEqual([]);
        // Act & Assert: error conditions
        expect(() => sut.current()).toThrowError('End of cursor');
        expect(() => sut.next()).toThrowError('End of cursor');
        expect(() => sut.prev()).toThrowError('Start of cursor');
        expect(() => sut.skip(1)).toThrowError('Index out of bounds');
        expect(() => sut.setIndex(1)).toThrowError('Index out of bounds');
    });

    it('readWhile with predicate false initially does not advance', () => {
        const sut = new ArrayCursor([1, 2, 3]);
        const out = sut.readWhile((n) => (n as number) < 0);
        expect(out.toArray()).toEqual([]);
        expect(sut.getIndex()).toBe(0);
        expect(sut.current()).toBe(1);
    });

    it('readAmount(0) returns empty and does not advance', () => {
        // Arrange: single-item cursor
        const sut = new ArrayCursor(["z"]);
        const out = sut.readAmount(0);
        expect(out.toArray()).toEqual([]);
        expect(sut.getIndex()).toBe(0);
        expect(sut.current()).toBe("z");
    });

    it('skip(0) does not change index', () => {
        // Arrange: two-item cursor advanced once
        const sut = new ArrayCursor(["a", "b"]);
        sut.next();
        sut.skip(0);
        expect(sut.getIndex()).toBe(1);
        expect(sut.current()).toBe("b");
    });

    it('setIndex to EOL then back to 0 works', () => {
        // Arrange: two-item cursor
        const sut = new ArrayCursor(["p", "q"]);
        sut.setIndex(2);
        expect(sut.isEOL()).toBe(true);
        sut.setIndex(0);
        expect(sut.isEOL()).toBe(false);
        expect(sut.next()).toBe("p");
    });

    it('consumed and remaining at various positions', () => {
        // Arrange: three-item cursor
        const sut = new ArrayCursor([1, 2, 3]);
        expect(sut.consumed().toArray()).toEqual([]);
        expect(sut.remaining().toArray()).toEqual([1, 2, 3]);
        sut.next();
        expect(sut.consumed().toArray()).toEqual([1]);
        expect(sut.remaining().toArray()).toEqual([2, 3]);
        sut.setIndex(3);
        expect(sut.consumed().toArray()).toEqual([1, 2, 3]);
        expect(sut.remaining().toArray()).toEqual([]);
    });

    it('prev from EOL returns last item', () => {
        // Arrange: three-item cursor at EOL
        const sut = new ArrayCursor(["x", "y", "z"]);
        sut.setIndex(3);
        const last = sut.prev();
        expect(last).toBe("z");
        expect(sut.getIndex()).toBe(2);
    });

    it('for..of yields nothing at EOL', () => {
        // Arrange: single-item cursor at EOL
        const sut = new ArrayCursor(["a"]);
        sut.setIndex(1);
        const seen: string[] = [];
        for (const v of sut) {
            seen.push(v);
        }
        expect(seen).toEqual([]);
    });

    it('stream yields nothing at EOL', () => {
        // Arrange: empty cursor
        const sut = new ArrayCursor<number>([]);
        const seen: number[] = [];
        for (const v of sut.stream()) {
            seen.push(v);
        }
        expect(seen).toEqual([]);
    });

    it('mapped cursor does not affect original on advance', () => {
        // Arrange: original cursor and derived mapped cursor
        const original = new ArrayCursor([1, 2, 3]);
        const mapped = original.map((n) => n * 10);
        expect(mapped.getIndex()).toBe(0);
        expect(original.getIndex()).toBe(0);
        // Act
        mapped.next();
        // Assert
        expect(mapped.getIndex()).toBe(1);
        expect(original.getIndex()).toBe(0);
    });

    it('findIndex returns -1 when not found', () => {
        // Arrange: two strings with no match
        const cursor = new ArrayCursor(["aa", "bb"]);
        expect(cursor.findIndex((s) => s.startsWith('c'))).toBe(-1);
    });

    it('instanceOf on empty array returns true (vacuous)', () => {
        // Arrange: empty cursor
        const empty = new ArrayCursor<any>([]);
        expect(empty.instanceOf(Object)).toBe(true);
    });

    it('includesInstanceOf with subclass instances', () => {
        // Arrange: Base/Sub classes and mixed instances
        class Base {
        }

        class Sub extends Base {
        }

        const arr = new ArrayCursor<any>([new Sub(), new Date()]);
        expect(arr.includesInstanceOf(Base)).toBe(true);
    });

    it('print includes index and items in call args', () => {
        const cursor = new ArrayCursor(["alpha"]);
        const dirSpy = vi.spyOn(console, 'dir').mockImplementation(() => {
        });
        cursor.next();
        cursor.print();
        const args = (dirSpy.mock.calls[0] as any)[0];
        expect(args).toHaveProperty('index', 1);
        expect(args).toHaveProperty('items');
        dirSpy.mockRestore();
    });
});
