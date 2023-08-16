const randomGenerator: () => number = () => crypto ? crypto.getRandomValues(new Uint8Array(1))[0] : Math.random() * 255;

/**
 * Helper function to retrieve a random UUID.
 * @returns A randomly generated UUIDv4.
 */
export function uuid(): string {
    return '10000000-1000-4000-8000-100000000000'.replace(
        /[018]/g,
        (c: string) => {
            const i: number = Number(c);
            // eslint-disable-next-line no-bitwise
            return (i ^ randomGenerator() & 15 >> i / 4).toString(16)
        }
    );
}