import { PathLike } from "fs";

// For secureJSON.adapter.ts
export type Options = {
    username?: string;
    password?: string;
}

// Adapter structure 
export interface Adapter {
    serialize(data: any): string;
    deserialize(data: string): unknown;
}

// For Collection.ts class
export type QueryOperator<T> = {
    $gt?: T;
    $lt?: T;
    $gte?: T;
    $lte?: T;
    $eq?: T;
    $ne?: T;
    $in?: T extends (infer U)[] ? U[] : T[];
    $nin?: T extends (infer U)[] ? U[] : T[];
};

export type Query<T> = {
    [P in keyof T]?: T[P] extends object
    ? Query<T[P]> | QueryOperator<T[P]>
    : T[P] | QueryOperator<T[P]>;
};
export interface ICollection<T> {
    insertOne(doc: T & Partial<InferSchemaType<any>>): void;
    insertMany(docs: (T & Partial<InferSchemaType<any>>)[]): void;
    find(query?: Query<T & Partial<InferSchemaType<any>>>): T[];
    findById(_id: string): T | undefined;
    deleteOne(query: Query<T & Partial<InferSchemaType<any>>>): void;
    deleteById(_id: string): void;
    updateOne(query: Query<T & Partial<InferSchemaType<any>>>, update: Partial<T & Partial<InferSchemaType<any>>>): void;
    updateById(_id: string, update: Partial<T & Partial<InferSchemaType<any>>>): void;
}

export interface IAdapter {
    serialize(data: any): string;
    deserialize(data: string): any;
}


// For Schema.ts class
export type Type = "string" | "number" | "boolean" | "object" | "array" | "date";

export interface SchemaConfig {
    type: Type;
    required: boolean;
    unique?: boolean;
    items?: Type;
    schema?: { [key: string]: SchemaConfig };
}

export type TypeMap = {
    string: string;
    number: number;
    boolean: boolean;
    object: { [key: string]: any };
    date: Date;
    array: any[];
};


export type InferSchemaType<T extends { [key: string]: SchemaConfig }> = {
    [K in keyof T]: T[K]["type"] extends "array"
    ? T[K]["items"] extends keyof TypeMap
    ? TypeMap[T[K]["items"]][]
    : any[]
    : T[K]["type"] extends "object"
    ? T[K]["schema"] extends { [key: string]: SchemaConfig }
    ? InferSchemaType<T[K]["schema"]>
    : { [key: string]: any }
    : T[K]["type"] extends keyof TypeMap
    ? TypeMap[T[K]["type"]]
    : never;
};

export interface ValidationResponse {
    status: "ERROR" | "SUCCESS";
    errorMessage: string;
}

export interface ISchema<T extends { [key: string]: SchemaConfig }> {
    getUniqueFields(): string[];
    validate(obj: Partial<InferSchemaType<T>>): ValidationResponse;
}

export type InferType<T extends ISchema<any>> = T extends ISchema<infer U>
    ? InferSchemaType<U> & Partial<BaseDocument>
    : never;

// For Database.ts class
export type BaseDocument = {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
};

export interface IDatabaseOptions {
    dbDirLocation: PathLike | string,
    dbExtension?: string
}