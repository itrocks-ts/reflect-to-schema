[![npm version](https://img.shields.io/npm/v/@itrocks/reflect-to-schema?logo=npm)](https://www.npmjs.org/package/@itrocks/reflect-to-schema)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/reflect-to-schema)](https://www.npmjs.org/package/@itrocks/reflect-to-schema)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/reflect-to-schema?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/reflect-to-schema)
[![issues](https://img.shields.io/github/issues/itrocks-ts/reflect-to-schema)](https://github.com/itrocks-ts/reflect-to-schema/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# reflect-to-schema

Converts a TypeScript class and columns structure into a RDB schema.

*This documentation was written by an artificial intelligence and may contain errors or approximations.
It has not yet been fully reviewed by a human. If anything seems unclear or incomplete,
please feel free to contact the author of this package.*

## Installation

```bash
npm i @itrocks/reflect-to-schema
```

## Usage

`@itrocks/reflect-to-schema` exposes a single public class
`ReflectToTable`, which converts a reflected TypeScript class into a
`Table` instance from `@itrocks/schema`.

The package relies on the metadata provided by other `@itrocks/*`
packages (`@itrocks/reflect`, `@itrocks/property-type`,
`@itrocks/store`, `@itrocks/length`, `@itrocks/precision`,
`@itrocks/range`, `@itrocks/value`, etc.). You typically do not use it
in isolation, but as part of a model layer where classes are already
decorated and registered.

### Minimal example

```ts
import { ReflectToTable } from '@itrocks/reflect-to-schema'

class User {
  id!: number
  email!: string
}

const reflectToTable = new ReflectToTable()
const table         = reflectToTable.convert(User)

console.log(table.name)     // "user"
console.log(table.columns)  // array of Column definitions
console.log(table.indexes)  // array of Index definitions
```

In this simple example, `ReflectToTable` analyses the `User` class
using the reflection metadata and generates:

- a default primary key column `id` with an auto-incrementing integer
  type
- one column for each reflected property (`email` in the example),
  with type and nullability inferred from the property metadata
- primary and secondary indexes, including representative indexes if
  defined by `@itrocks/class-view`

### Complete example: model-to-database synchronization

`ReflectToTable` is most often used together with:

- `@itrocks/mysql-to-schema` – to read existing MySQL/MariaDB schemas
- `@itrocks/schema-diff` and `@itrocks/schema-diff-mysql` – to compute
  and translate schema differences
- `@itrocks/schema-to-mysql` – to generate SQL statements
- `@itrocks/mysql-maintainer` – a higher-level helper that orchestrates
  all these steps

The following example is adapted from the documentation of
`@itrocks/mysql-to-schema` and shows the role of
`ReflectToTable` in a typical workflow:

```ts
import mariadb                              from 'mariadb'
import type { Connection }                  from 'mariadb'
import { MysqlToTable }                     from '@itrocks/mysql-to-schema'
import { ReflectToTable }                   from '@itrocks/reflect-to-schema'
import { TableDiff }                        from '@itrocks/schema-diff'
import { SchemaDiffMysql }                  from '@itrocks/schema-diff-mysql'
import { SchemaToMysql }                    from '@itrocks/schema-to-mysql'

class User {
  id!: number
  email!: string
}

async function synchronizeUserTable(connection: Connection) {
  const tableName = 'user'

  // Schema from the database
  const mysqlToTable   = new MysqlToTable(connection)
  const existingSchema = await mysqlToTable.convert(tableName)
  mysqlToTable.normalize(existingSchema)

  // Schema from the TypeScript model
  const reflectToTable = new ReflectToTable()
  const targetSchema   = reflectToTable.convert(User)

  // Compute the diff and translate it to SQL
  const diff        = new TableDiff(existingSchema, targetSchema)
  const diffToMysql = new SchemaDiffMysql()
  const sql         = diffToMysql.sql(diff, /* allowDeletions */ false)

  if (sql.trim()) {
    await connection.query(sql)
  }
}

async function main() {
  const pool = mariadb.createPool({
    host:     'localhost',
    user:     'root',
    password: 'secret',
    database: 'my_app',
  })

  const connection = await pool.getConnection()
  try {
    await synchronizeUserTable(connection)
  }
  finally {
    connection.release()
    await pool.end()
  }
}

main().catch(console.error)
```

In real applications, you will usually rely directly on
`@itrocks/mysql-maintainer`, which wraps this pattern and uses
`ReflectToTable` internally.

## API

### `class ReflectToTable`

Main entry point of the package. `ReflectToTable` is an alias of the
internal `ToTable` class.

It converts a reflected TypeScript class (or constructor function) into
an `@itrocks/schema` `Table` definition, based on the metadata provided
by the surrounding `@itrocks/*` ecosystem.

#### Constructor

```ts
new ReflectToTable()
```

Creates a new converter instance. The instance is stateless and can be
reused to convert multiple classes.

#### Methods

##### `convert(type: Type): Table`

Convert a given class (or constructor function) into a `Table`
instance.

```ts
import type { ObjectOrType } from '@itrocks/class-type'
import { ReflectToTable }    from '@itrocks/reflect-to-schema'

function tableOf<T extends object>(type: ObjectOrType<T>) {
  return new ReflectToTable().convert(type)
}
```

###### Parameters

- `type: Type` – a class constructor or reflected type as defined by
  `@itrocks/class-type`. The type must be registered in a store via
  `@itrocks/store` (`storeOf(type)` must return a non-empty name),
  otherwise an error is thrown.

###### Returns

- `Table` – a `Table` instance from `@itrocks/schema` containing:
  - `name` – the table name, typically derived from the store name
  - `collation` – default collation (`utf8mb4_0900_ai_ci`)
  - `engine` – default storage engine (`InnoDB`)
  - `columns` – columns generated from the class properties, including
    an auto-increment `id` column and additional columns inferred from
    metadata (type, optionality, former names, value ranges, lengths,
    etc.)
  - `indexes` – indexes for primary key, representative properties, and
    `id`-like relations

###### Errors

- Throws a string error `"Type not stored " + type` if the given type
  is not registered in a store (`storeOf(type)` is falsy).

## Typical use cases

- **Generating table definitions from your model layer** – convert each
  of your domain classes into a `Table` and feed them into other schema
  tools (`@itrocks/schema-diff`, `@itrocks/schema-to-mysql`, etc.).
- **Synchronizing a database schema with TypeScript models** – combine
  `ReflectToTable` with `@itrocks/mysql-to-schema`,
  `@itrocks/schema-diff`, and `@itrocks/schema-diff-mysql` to compute
  and apply schema migrations.
- **Inspecting or documenting your data model** – generate a
  programmatic `Table` representation for tooling, documentation
  generators, or introspection utilities.
- **Higher-level maintenance workflows** – use libraries such as
  `@itrocks/mysql-maintainer`, which build on top of
  `ReflectToTable` to provide opinionated automated migrations.
