import { randomInt } from 'node:crypto';

/**
 * Returns a function that generates random IDs of a fixed length from the given
 * alphabet, using Node's cryptographically secure random number generator.
 * Drop-in replacement for nanoid's customAlphabet, which is ESM-only.
 */
export function customAlphabet(alphabet: string, size: number): () => string {
  if (alphabet.length === 0) {
    throw new Error('customAlphabet: alphabet must not be empty');
  }
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error('customAlphabet: size must be a positive integer');
  }

  return (): string => {
    let id = '';
    for (let i = 0; i < size; i += 1) {
      id += alphabet.charAt(randomInt(alphabet.length));
    }
    return id;
  };
}