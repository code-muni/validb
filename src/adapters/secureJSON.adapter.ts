import { Adapter, Options } from "../types";
import { decrypt, encrypt } from "./utils/dataCryptography";



/**
 * JsonAdapter class extends the abstract Adapter class to provide serialization and deserialization
 * functionalities with optional encryption using a secret key derived from provided username and password.
 */
export class JsonAdapter implements Adapter {
    private secretKey?: string;

    /**
     * Constructs a JsonAdapter instance with optional encryption capabilities.
     * @param {Options} encryptionInfo - The username and password for encryption.
     */
    constructor(encryptionInfo?: Options) {

        if (encryptionInfo && (encryptionInfo.username && encryptionInfo.password)) {
            this.secretKey = `${encryptionInfo.username}PYOJAN${encryptionInfo.password}`;
        }
    }

    /**
     * Serializes the provided data object to a JSON string, optionally encrypting it if a secret key is available.
     * @param {Record<string, unknown>} data - The data object to serialize.
     * @returns {string} The serialized (and possibly encrypted) data as a string.
     * @throws {Error} Throws an error if the data is not a valid object or serialization fails.
     * 
     * @example
     * ```typescript
     * const adapter = new JsonAdapter({username: 'user', password: 'pass'});
     * const serializedData = adapter.serialize({key: 'value'});
     * console.log(serializedData); // Outputs encrypted JSON string
     * ```
     */
    public serialize(data: Record<string, unknown>): string {
        if (typeof data !== 'object' || data === null) {
            throw new Error("Invalid data type for serialization.");
        }
        let serializeData = JSON.stringify(data);
        if (this.secretKey) {
            try {
                serializeData = encrypt(serializeData, this.secretKey);
            } catch (error) {
                throw new Error(`Failed to serialize data in JSONAdapter: ${error instanceof Error ? error.message : error}`);
            }
        }
        return serializeData;
    }

    /**
     * Deserializes the provided JSON string to an object, optionally decrypting it if a secret key is available.
     * @param {string} data - The JSON string to deserialize.
     * @returns {Record<string, unknown>} The deserialized data object.
     * @throws {Error} Throws an error if the data is not a valid string or deserialization fails.
     * 
     * @example
     * ```typescript
     * const adapter = new JsonAdapter({username: 'user', password: 'pass'});
     * const deserializedData = adapter.deserialize(encryptedData);
     * console.log(deserializedData); // Outputs original data object
     * ```
     */
    public deserialize(data: string): Record<string, unknown> {
        if (typeof data !== 'string') {
            throw new Error("Invalid data type for deserialization.");
        }
        let deserializeData: string = data;
        if (this.secretKey) {
            try {
                deserializeData = decrypt(deserializeData, this.secretKey);
            } catch (error) {
                throw new Error(`Failed to deserialize data in JSONAdapter: ${error instanceof Error ? error.message : error}`);
            }
        }
        return JSON.parse(deserializeData);
    }
}