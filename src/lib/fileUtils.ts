import { readFileSync, writeFileSync } from "fs";

/**
 * Reads the content of a file and returns it as a string.
 * @param {string} filePath - The path of the file to read.
 * @returns {string} The content of the file.
 */
export function readFile(filePath: string): string {
    return readFileSync(filePath, 'utf-8').toString();
}

/**
 * @param {string} filePath - The path of the file to write.
 * @param {string} data - The data to write to the file.
 */
export function writeFile(filePath: string, data: string): void {
    writeFileSync(filePath, data);
}
