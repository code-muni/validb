import { InferSchemaType, SchemaConfig } from "../types";

/**
 * Class representing a schema.
 */
class Schema<T extends { [key: string]: SchemaConfig }> {
  private schema: T;
  private uniqueFields: string[];

  constructor(schema: T) {
    this.schema = schema;
    this.uniqueFields = this.extractUniqueFields();
  }

  private extractUniqueFields(): string[] {
    const uniqueFields: string[] = [];
    for (const key in this.schema) {
      if (this.schema[key].unique) {
        uniqueFields.push(key);
      }
    }
    return uniqueFields;
  }

  getUniqueFields(): string[] {
    return this.uniqueFields;
  }

  /**
   * Validate the object against the schema.
   * @param {Partial<InferSchemaType<T>>} obj - The object to validate.
   * @returns {{ status: string, errorMessage: string }} The validation result.
   *
   * @example
   * typescript
   * const schema = new Schema({
   *   age: { type: "number", unique: true, required: true },
   *   name: { type: "string", unique: true, required: true },
   *   isActive: { type: "boolean", unique: true, required: true }
   * });
   * const validObject = {
   *   age: 30,
   *   name: "John",
   *   isActive: true
   * };
   * console.log(schema.validate(validObject)); // Outputs: { status: "success", errorMessage: "" }
   *
   */
  validate(obj: Partial<InferSchemaType<T>>): {
    status: "ERROR" | "SUCCESS";
    errorMessage: string;
  } {
    for (const key in this.schema) {
      const config = this.schema[key];
      const value = obj[key as keyof typeof obj];

      if (config.required && value === undefined) {
        return {
          status: "ERROR",
          errorMessage: `Property ${key} is required.`,
        };
      }

      if (value !== undefined) {
        if (config.type === "array") {
          if (!Array.isArray(value)) {
            return {
              status: "ERROR",
              errorMessage: `Property ${key} should be an array.`,
            };
          }
          if (config.items) {
            for (const item of value) {
              if (typeof item !== config.items) {
                return {
                  status: "ERROR",
                  errorMessage: `All items in array ${key} should be of type ${config.items}.`,
                };
              }
            }
          }
        } else if (config.type === "object") {
          if (typeof value !== "object" || Array.isArray(value)) {
            return {
              status: "ERROR",
              errorMessage: `Property ${key} should be an object.`,
            };
          }
          if (config.schema) {
            const nestedSchema = new Schema(config.schema);
            const nestedValidation = nestedSchema.validate(
              value as Partial<InferSchemaType<typeof config.schema>>
            );
            if (nestedValidation.status === "ERROR") {
              return nestedValidation;
            }
          }
        } else if (config.type === "date") {
          if (!(value instanceof Date)) {
            return {
              status: "ERROR",
              errorMessage: `Property ${key} should be of type ${config.type}.`,
            };
          }
        } else if (typeof value !== config.type) {
          return {
            status: "ERROR",
            errorMessage: `Property ${key} should be of type ${config.type}.`,
          };
        }
      }
    }
    return { status: "SUCCESS", errorMessage: "" };
  }
}

export { Schema };