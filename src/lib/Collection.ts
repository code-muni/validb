import { existsSync } from "fs";
import { Schema } from "./Schema";
import { readFile, writeFile } from "./fileUtils";
import { basename } from "path";
import {
  Adapter,
  ICollection,
  InferSchemaType,
  Query,
  QueryOperator,
} from "../types";

export default class Collection<T> implements ICollection<T> {
  private _adapter: Adapter;
  private _collectionPath: string;
  private _schema: Schema<any>;

  /**
   * Creates an instance of Collection.
   *
   * @param {string} collectionPath - The file path to store the collection data.
   * @param {Adapter} adapter - The adapter to handle data serialization/deserialization.
   * @param {Schema<any>} schema - The schema to validate documents against.
   */
  constructor(collectionPath: string, adapter: Adapter, schema: Schema<any>) {
    this._adapter = adapter;
    this._collectionPath = collectionPath;
    this._schema = schema;
    this.initializeCollection();
  }

  /**
   * Initializes the collection by creating the file if it doesn't exist.
   * @private
   */
  private initializeCollection() {
    if (!existsSync(this._collectionPath)) {
      this.writeCollectionData([]);
    }
  }

  /**
   * Writes data to the collection file.
   *
   * @param {any} data - The data to write.
   * @private
   */
  private writeCollectionData(data: any) {
    const stringifiedData = this._adapter.serialize(data);
    writeFile(this._collectionPath, stringifiedData);
  }

  /**
   * Reads data from the collection file.
   *
   * @returns {T[]} The data read from the collection file.
   * @private
   */
  private readCollectionData(): (T & Partial<InferSchemaType<any>>)[] {
    const collectionData = readFile(this._collectionPath);
    return this._adapter.deserialize(collectionData) as (T &
      Partial<InferSchemaType<any>>)[];
  }

  /**
   * Inserts a single document into the collection.
   *
   * @param {T & Partial<InferSchemaType<any>>} doc - The document to insert.
   * @throws {Error} If the document fails schema validation.
   */
  public insertOne(doc: T & Partial<InferSchemaType<any>>) {
    this.insertDocuments([doc]);
  }

  /**
   * Inserts multiple documents into the collection.
   *
   * @param {(T & Partial<InferSchemaType<any>>)[]} docs - The documents to insert.
   * @throws {Error} If any document fails schema validation.
   */
  public insertMany(docs: (T & Partial<InferSchemaType<any>>)[]) {
    this.insertDocuments(docs);
  }

  /**
   * Inserts documents into the collection.
   *
   * @param {(T & Partial<InferSchemaType<any>>)[]} docs - The documents to insert.
   * @throws {Error} If any document fails schema validation or if there are duplicate unique fields.
   */
  private insertDocuments(docs: (T & Partial<InferSchemaType<any>>)[]) {
    // Validate each document
    docs.forEach((doc) => this.validateDocument(doc));

    const uniqueFields = this._schema.getUniqueFields();
    const collection: any[] = this.readCollectionData();

    // Create a map to store unique field values for quick lookup
    const uniqueFieldValues = this.populateUniqueFieldValues(
      uniqueFields,
      collection
    );

    // Check for duplicates in the new documents
    docs.forEach((doc) => {
      uniqueFields.forEach((field) => {
        if (
          doc[field] !== undefined &&
          uniqueFieldValues.get(field)!.has(doc[field])
        ) {
          throw new Error(
            `E11000 duplicate key error collection: ${this.getCollectionName()} index: ${field}_1 dup key: { ${field}: "${
              doc[field]
            }" }`
          );
        }
      });
    });

    // Create new documents and add them to the collection
    const newDocs = docs.map((doc) => this.createNewDoc(doc));
    const updatedCollection = collection.concat(newDocs);
    this.writeCollectionData(updatedCollection);
  }

  /**
   * Populates a map with unique field values from the existing collection data.
   *
   * @param {string[]} uniqueFields - The unique fields to track.
   * @param {any[]} collection - The existing collection data.
   * @returns {Map<string, Set<any>>} A map of unique field values.
   */
  private populateUniqueFieldValues(
    uniqueFields: string[],
    collection: any[]
  ): Map<string, Set<any>> {
    const uniqueFieldValues = new Map<string, Set<any>>();

    uniqueFields.forEach((field) => {
      uniqueFieldValues.set(field, new Set());
    });

    collection.forEach((item) => {
      uniqueFields.forEach((field) => {
        if (item[field] !== undefined) {
          uniqueFieldValues.get(field)!.add(item[field]);
        }
      });
    });

    return uniqueFieldValues;
  }

  /**
   * Retrieves the collection name from the collection path.
   *
   * @returns {string} The collection name.
   */
  private getCollectionName(): string {
    return basename(this._collectionPath).split(".vdb")[0];
  }

  /**
   * Finds documents in the collection that match the query.
   *
   * @param {Query<T & Partial<InferSchemaType<any>>>} [query] - The query to filter documents.
   * @returns {T[]} The documents that match the query.
   */
  public find(
    query?: Query<T & Partial<InferSchemaType<any>>>,
    sortOrder: "asc" | "des" = "des"
  ): T[] {
    const docs = this.readCollectionData();

    const filteredDocs = query
      ? docs.filter((item) => this.matchesQuery(item, query))
      : docs;

    const order = sortOrder === "asc" ? 1 : -1;
    filteredDocs.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return (dateA - dateB) * order;
    });

    return filteredDocs;
  }

  /**
   * Finds a document by its ID.
   *
   * @param {string} _id - The ID of the document to find.
   * @returns {T | undefined} The document with the matching ID, or undefined if not found.
   */
  public findById(_id: string): T | undefined {
    const docs = this.readCollectionData();
    return docs.find((doc: any) => doc._id === _id);
  }

  /**
   * Deletes a single document that matches the query.
   *
   * @param {Query<T & Partial<InferSchemaType<any>>>} query - The query to filter documents.
   * @throws {Error} If no document matches the query.
   */
  public deleteOne(query: Query<T & Partial<InferSchemaType<any>>>): void {
    const docs = this.readCollectionData();
    const docToDelete = docs.find((item) => this.matchesQuery(item, query));
    if (!docToDelete) {
      throw new Error("No document matches the query");
    }
    const updatedCollection = docs.filter((item) => item !== docToDelete);
    this.writeCollectionData(updatedCollection);
  }

  /**
   * Deletes a document by its ID.
   *
   * @param {string} _id - The ID of the document to delete.
   * @throws {Error} If no document matches the ID.
   */
  public deleteById(_id: string): void {
    const docs = this.readCollectionData();
    const docToDelete = docs.find((doc: any) => doc._id === _id);
    if (!docToDelete) {
      throw new Error("No document matches the ID");
    }
    const updatedCollection = docs.filter((item) => item !== docToDelete);
    this.writeCollectionData(updatedCollection);
  }
  /**
   * Updates a single document that matches the query.
   *
   * @param {Query<T & Partial<InferSchemaType<any>>>} query - The query to filter documents.
   * @param {T & Partial<InferSchemaType<any>>} update - The update to apply.
   * @throws {Error} If no document matches the query or if the update violates unique constraints.
   */
  public updateOne(
    query: Query<T & Partial<InferSchemaType<any>>>,
    update: Partial<T & Partial<InferSchemaType<any>>>
  ): void {
    const docs = this.readCollectionData();
    const docIndex = docs.findIndex((item) => this.matchesQuery(item, query));

    if (docIndex === -1) {
      throw new Error(
        `No document matches the query: ${JSON.stringify(query)}`
      );
    }

    this.updateDocument(docs, docIndex, update);
  }

  /**
   * Updates a document by its ID.
   *
   * @param {string} _id - The ID of the document to update.
   * @param {T & Partial<InferSchemaType<any>>} update - The update to apply.
   * @throws {Error} If no document matches the ID or if the update violates unique constraints.
   */
  public updateById(
    _id: string,
    update: Partial<T & Partial<InferSchemaType<any>>>
  ): void {
    const docs = this.readCollectionData();
    const docIndex = docs.findIndex((doc: any) => doc._id === _id);

    if (docIndex === -1) {
      throw new Error(`No document matches the ID: ${_id}`);
    }

    this.updateDocument(docs, docIndex, update);
  }

  /**
   * Updates a document in the collection.
   *
   * @param {Array<T & Partial<InferSchemaType<any>>>} docs - The collection of documents.
   * @param {number} docIndex - The index of the document to update.
   * @param {Partial<T & Partial<InferSchemaType<any>>>} update - The update to apply.
   * @throws {Error} If the update violates unique constraints.
   */
  private updateDocument(
    docs: Array<T & Partial<InferSchemaType<any>>>,
    docIndex: number,
    update: Partial<T & Partial<InferSchemaType<any>>>
  ): void {
    const docToUpdate = docs[docIndex];
    const updatedDoc: T & Partial<InferSchemaType<any>> = {
      ...docToUpdate,
      ...update,
      updatedAt: new Date(),
    };

    // Validate the updated document
    this.validateDocument(updatedDoc);

    // Check for unique field violations
    const uniqueFields = this._schema.getUniqueFields();
    const uniqueFieldValues = new Set(
      uniqueFields.map((field) => docToUpdate[field])
    );

    uniqueFields.forEach((field) => {
      if (
        updatedDoc[field] !== undefined &&
        !uniqueFieldValues.has(updatedDoc[field])
      ) {
        const isDuplicate = docs.some(
          (doc, index) => index !== docIndex && doc[field] === updatedDoc[field]
        );
        if (isDuplicate) {
          throw new Error(
            `E11000 duplicate key error collection: ${this.getCollectionName()} index: ${field}_1 dup key: { ${field}: "${
              updatedDoc[field]
            }" }`
          );
        }
      }
    });

    // Only update if there are changes
    if (!this.deepEqual(docToUpdate, updatedDoc)) {
      docs[docIndex] = updatedDoc;
      this.writeCollectionData(docs);
    }
  }

  /**
   * Deep equality check for objects.
   *
   * @param {object} obj1 - The first object to compare.
   * @param {object} obj2 - The second object to compare.
   * @returns {boolean} True if the objects are equal, false otherwise.
   */
  private deepEqual(
    obj1: Record<string, any>,
    obj2: Record<string, any>
  ): boolean {
    if (obj1 === obj2) return true;
    if (
      typeof obj1 !== "object" ||
      typeof obj2 !== "object" ||
      obj1 === null ||
      obj2 === null
    )
      return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key) || !this.deepEqual(obj1[key], obj2[key]))
        return false;
    }

    return true;
  }

  /**
   * Validates a document against the schema.
   *
   * @param {T & Partial<InferSchemaType<any>>} doc - The document to validate.
   * @throws {Error} If the document fails schema validation.
   * @private
   */
  private validateDocument(doc: T & Partial<InferSchemaType<any>>) {
    const { status, errorMessage } = this._schema.validate(doc);
    if (status === "ERROR") {
      throw new Error(errorMessage);
    }
  }

  /**
   * Creates a new document with additional metadata.
   *
   * @param {T & Partial<InferSchemaType<any>>} doc - The document to enhance.
   * @returns {T} The new document.
   * @private
   */
  private createNewDoc(doc: T & Partial<InferSchemaType<any>>): T {
    return {
      _id: this.generateId(),
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Checks if a document matches the given query.
   *
   * @param {T} item - The document to check.
   * @param {Query<T>} query - The query to match against.
   * @returns {boolean} True if the document matches the query, otherwise false.
   * @private
   */
  private matchesQuery(item: T, query: Query<T>): boolean {
    return (Object.keys(query) as (keyof T)[]).every((key) => {
      const queryValue = query[key];
      const itemValue = item[key];
      if (this.isQueryOperator(queryValue)) {
        return this.applyQueryOperator(
          itemValue as any,
          queryValue as QueryOperator<any>
        );
      } else if (typeof queryValue === "object" && queryValue !== null) {
        console.log("OBJECT");
        return this.matchesQuery(itemValue as any, queryValue as Query<any>);
      } else {
        return itemValue === queryValue;
      }
    });
  }

  /**
   * Applies a query operator to a document field.
   *
   * @template T
   * @param {T} itemValue - The value of the document field.
   * @param {QueryOperator<T>} queryOperator - The query operator to apply.
   * @returns {boolean} True if the field matches the operator, otherwise false.
   * @private
   */
  private applyQueryOperator<T>(
    itemValue: T,
    queryOperator: QueryOperator<T>
  ): boolean {
    const checks: [boolean, boolean][] = [
      [
        queryOperator.$gt !== undefined &&
          queryOperator.$gt !== null &&
          !(itemValue > queryOperator.$gt),
        true,
      ],
      [
        queryOperator.$lt !== undefined &&
          queryOperator.$lt !== null &&
          !(itemValue < queryOperator.$lt),
        true,
      ],
      [
        queryOperator.$gte !== undefined &&
          queryOperator.$gte !== null &&
          !(itemValue >= queryOperator.$gte),
        true,
      ],
      [
        queryOperator.$lte !== undefined &&
          queryOperator.$lte !== null &&
          !(itemValue <= queryOperator.$lte),
        true,
      ],
      [
        queryOperator.$eq !== undefined && itemValue !== queryOperator.$eq,
        false,
      ],
      [
        queryOperator.$ne !== undefined && itemValue === queryOperator.$ne,
        false,
      ],
      [
        queryOperator.$in !== undefined &&
          !this.isInArray(itemValue, queryOperator.$in),
        true,
      ],
      [
        queryOperator.$nin !== undefined &&
          this.isInArray(itemValue, queryOperator.$nin),
        false,
      ],
      [
        queryOperator.where !== undefined &&
          !(itemValue === queryOperator.where),
        true,
      ],
    ];
    return checks.every(([check, negate]) => !negate || !check);
  }

  /**
   * Checks if a value is in an array.
   *
   * @template T
   * @param {T} itemValue - The value to check.
   * @param {T[]} array - The array to check against.
   * @returns {boolean} True if the value is in the array, otherwise false.
   * @private
   */
  private isInArray<T>(itemValue: T, array: T[]): boolean {
    if (Array.isArray(itemValue)) {
      return itemValue.some((val) => array.includes(val));
    }
    return array.includes(itemValue);
  }

  /**
   * Checks if an object is a query operator.
   *
   * @template T
   * @param {any} obj - The object to check.
   * @returns {boolean} True if the object is a query operator, otherwise false.
   * @private
   */
  private isQueryOperator<T>(obj: any): obj is QueryOperator<T> {
    const keys = [
      "$gt",
      "$lt",
      "$gte",
      "$lte",
      "$eq",
      "$ne",
      "$in",
      "$nin",
      "where",
    ];
    return Object.keys(obj).some((key) => keys.includes(key));
  }

  /**
   * Generates a unique identifier ObjectID.
   *
   * @returns {string} The generated identifier.
   * @private
   */
  private generateId(): string {
    const timestamp = Math.floor(Date.now() / 1000).toString(16);
    const randomValue = Math.random().toString(16).substring(2, 12);
    const counter = (this.counter = (this.counter + 1) % 0xffffff)
      .toString(16)
      .padStart(6, "0");

    return (timestamp + randomValue + counter).padEnd(24, "0");
  }
  private counter = Math.floor(Math.random() * 0xffffff);
}
