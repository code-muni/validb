import { join } from "path";
import { JsonAdapter } from "../src/adapters";
import { Database, Schema } from "../src/lib";
import { InferType } from "../src/types";

// Without encryption
const adapter = new JsonAdapter();

const DB = new Database(adapter, {
  dbDirLocation: join(__dirname, "database"),
  dbExtension: "vdb",
});

const UserSchema = new Schema({
  name: { type: "string", unique: false, required: true },
  username: { type: "string", unique: true, required: true },
  email: { type: "string", unique: true, required: true },
  password: { type: "string", required: true },
  phoneNumber: { type: "string", unique: true, required: false },
  isActive: { type: "boolean", unique: false, required: true },
  roles: { type: "array", items: "string", required: false,  },
  address: {
    type: "object",
    required: true,
    schema: {
      street: { type: "string", required: true },
      city: { type: "string", required: true },
      state: { type: "string", required: true },
      zipCode: { type: "number", required: true },
      country: { type: "string", required: true },
    },
  }
});

// Infer the type
type IUser = InferType<typeof UserSchema>;

const collection = DB.createCollection<IUser>("User", UserSchema);

// collection.insertOne({
//   name: "John Doe",
//   username: "johndoe",
//   email: "john.doe@example.com",
//   password: "securepassword",
//   phoneNumber: "123-456-7890",
//   isActive: true,
//   roles: ["user", "admin"],
//   address: {
//     street: "123 Main St",
//     city: "Anytown",
//     state: "Anystate",
//     zipCode: 12345,
//     country: "USA",
//   },
// });

// collection.insertMany([
//     {
//       name: "Jane Smith",
//       username: "janesmith",
//       email: "jane.smith@example.com",
//       password: "securepassword2",
//       phoneNumber: "987-654-3210",
//       isActive: false,
//       roles: ["user"],
//       address: {
//         street: "456 Another St",
//         city: "Othertown",
//         state: "Otherstate",
//         zipCode: 67890,
//         country: "USA"
//       }
//     },
//     {
//       name: "Alice Johnson",
//       username: "alicej",
//       email: "alice.j@example.com",
//       password: "securepassword3",
//       phoneNumber: "110025212",
//       isActive: true,
//       roles: ["user", "moderator"],
//       address: {
//         street: "789 Different St",
//         city: "Sometown",
//         state: "Somestate",
//         zipCode: 54321,
//         country: "USA"
//       }
//     }
//   ]);


console.log(collection.find({email: {}}))