export function isConsecutiveCycled(numbers: number[]): boolean {
    if (numbers.length < 2) {
        return numbers.length >= 1;
    }

    for (let i = 1; i < numbers.length; i++) {
        const expected = (numbers[i - 1]! + 1) % 10;

        if (numbers[i] !== expected) {
            return false;
        }
    }

    return true;
}