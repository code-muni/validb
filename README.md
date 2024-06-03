# valisign

### Overview

Introducing a specialized NoSQL database designed specifically for environments like **Node.js, Electron, and Bun.js**. This database offers robust features for **encryption and decryption of persistent data, along with customizable data read and write operations**. Below is a detailed overview of its key features:

### Key Features

1. **File-Based Storage**:
   - **Ease of Management**: *Data is stored in files, making it straightforward to manage and backup*.
   - **Lightweight and Embeddable**: *Ideal for applications with limited resources, ensuring minimal overhead*.

2. **NoSQL Structure**:
   - **Flexible Schema Design**: *Supports schema-based design, allowing for dynamic and adaptable data models*.
   - **Familiar API**: *Inspired by MongoDB, providing a familiar interface for developers to work with*.

3. **Encryption and Decryption**:
   - **Data Security**: *Built-in support for encrypting data before it is written to disk and decrypting it when read, ensuring data security at rest*.
   - **Modern Standards**: *Utilizes advanced encryption standards like AES-256 to protect sensitive information*.

4. **Customizable Data Operations**:
   - ***Adaptable Logic***: *Provides an adapter to customize data read and write operations*.
   - ***Custom Implementations***: *Allows developers to implement custom logic for data validation, transformation, or logging, enhancing flexibility*.

5. **TypeScript Support**:
   - ***Type Safety***: *Comprehensive TypeScript definitions ensure type safety*.
   - ***Enhanced Developer Experience***: *Provides autocompletion and type checking, improving the development workflow*.

6. **Zero Binary Dependencies**:
   - ***Simplified Deployment***: *No need for external binaries or native modules, making deployment easier*.
   - ***Compatibility***: *Reduces potential compatibility issues, ensuring a smoother integration process*.

This specialized NoSQL database is tailored to meet the needs of modern development environments, offering a secure, flexible, and developer-friendly solution for managing data.


## Installation
To install <kbd>**Validb**</kbd>, use one of the following package managers:

### npm
```bash
npm install validb --save
```

### yarn
```bash
yarn add validb --save
```

### bun
```bash
bun add validb
```

## API

It is a subset of MongoDB's API (the most used operations).


* <a href="#creating-a-database">Creating a database</a>

* <a href="#persistence">Persistence</a>

* <a href="#inserting-documents">Inserting documents</a>

* <a href="#finding-documents">Finding documents</a>

  * <a href="#basic-querying">Basic Querying</a>

  * <a href="#operators-lt-lte-gt-gte-in-nin-ne">Operators ($lt, $lte, $gt, $gte, $in, $nin, $ne)</a>

  * <a href="#array-fields">Array fields</a>

  * <a href="#sorting-and-paginating">Sorting and paginating</a>

  * <a href="#projections">Projections</a>

* <a href="#counting-documents">Counting documents</a>

* <a href="#updating-documents">Updating documents</a>

* <a href="#removing-documents">Removing documents</a>

* <a href="#indexing">Indexing</a>

* <a href="#browser-version">Browser version</a>

