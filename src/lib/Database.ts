import { PathLike, existsSync, mkdirSync } from "fs";
import { join } from "path";
import Collection from "./Collection";
import { Schema } from "./Schema";
import { Adapter, BaseDocument, IDatabaseOptions } from "../types";


/**
 * Class representing a Database.
 */
export class Database {
  private _adapter: Adapter;
  private _dbLocation: PathLike | string;
  private _dbExt: string = 'vdb'

  /**
   * Creates a new Database instance.
   * @param {Adapter} adapter - The adapter to be used for the database.
   * @param {IDatabaseOptions} options - The options for the database.
   */
  constructor(adapter: Adapter, options: IDatabaseOptions) {
    this._adapter = adapter;
    this._dbLocation = options.dbDirLocation;
    this._dbExt = options.dbExtension ? (options.dbExtension.startsWith('.') ? options.dbExtension.slice(1) : options.dbExtension) : this._dbExt;
    this.initializeDatabase();
  }

  /**
   * Initializes the database.
   */
  private initializeDatabase() {
    this.createDirectoryIfNotExists(this._dbLocation);
  }

  /**
   * Creates a directory if it does not exist.
   * @param {PathLike} path - The path of the directory to be created.
   */
  private createDirectoryIfNotExists(path: PathLike) {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
  }

  /**
 * Creates a new collection in the database.
 * @param {string} collectionName - The name of the collection to be created.
 * @returns {Collection} The newly created collection.
 */
  public createCollection<T extends Partial<BaseDocument>>(collectionName: string, schema: Schema<any>): Collection<T> {
    const collectionPath = join(this._dbLocation.toString(), `${collectionName}.${this._dbExt}`);
    return new Collection<T>(collectionPath, this._adapter, schema);
  }
}
