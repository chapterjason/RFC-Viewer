export function isConsecutive(numbers: number[]): boolean {
    if (numbers.length < 2) {
        return numbers.length >= 1;
    }

    const step = numbers[1]! - numbers[0]!;

    if (step !== 1 && step !== -1) {
        return false;
    }

    for (let i = 1; i < numbers.length; i++) {
        if (numbers[i]! - numbers[i - 1]! !== step) {
            return false;
        }
    }

    return true;
}