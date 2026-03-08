[**LuAI Host API Reference**](../README.md)

***

[LuAI Host API Reference](../README.md) / lib/database-provider-config

# lib/database-provider-config

## Type Aliases

### DatabaseProviderId

> **DatabaseProviderId** = `"sqlite"` \| `"turso"` \| `"postgres"`

Defined in: [lib/database-provider-config.ts:5](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L5)

***

### DatabaseProviderStatus

> **DatabaseProviderStatus** = `object`

Defined in: [lib/database-provider-config.ts:7](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L7)

#### Properties

##### selectedProvider

> **selectedProvider**: [`DatabaseProviderId`](#databaseproviderid)

Defined in: [lib/database-provider-config.ts:8](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L8)

##### source

> **source**: `"admin"` \| `"env"` \| `"default"`

Defined in: [lib/database-provider-config.ts:9](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L9)

##### sqlite

> **sqlite**: `object`

Defined in: [lib/database-provider-config.ts:10](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L10)

###### path

> **path**: `string`

##### turso

> **turso**: `object`

Defined in: [lib/database-provider-config.ts:13](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L13)

###### url

> **url**: `string`

###### hasAuthToken

> **hasAuthToken**: `boolean`

###### credentialsSource

> **credentialsSource**: `"admin"` \| `"env"` \| `null`

##### postgres

> **postgres**: `object`

Defined in: [lib/database-provider-config.ts:18](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L18)

###### connectionString

> **connectionString**: `string`

###### hasConnectionString

> **hasConnectionString**: `boolean`

###### credentialsSource

> **credentialsSource**: `"admin"` \| `"env"` \| `null`

***

### ActiveDatabaseConnectionConfig

> **ActiveDatabaseConnectionConfig** = \{ `provider`: `"sqlite"`; `source`: `"admin"` \| `"default"`; `sqlitePath`: `string`; `cacheKey`: `string`; \} \| \{ `provider`: `"turso"`; `source`: `"admin"` \| `"env"`; `tursoUrl`: `string`; `tursoAuthToken`: `string`; `cacheKey`: `string`; \} \| \{ `provider`: `"postgres"`; `source`: `"admin"` \| `"env"`; `postgresConnectionString`: `string`; `cacheKey`: `string`; \}

Defined in: [lib/database-provider-config.ts:38](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L38)

Resolved runtime database connection after combining admin and environment config.

## Functions

### getDefaultSqliteDatabasePath()

> **getDefaultSqliteDatabasePath**(): `string`

Defined in: [lib/database-provider-config.ts:89](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L89)

#### Returns

`string`

***

### getDatabaseProviderStatus()

> **getDatabaseProviderStatus**(): `Promise`\<[`DatabaseProviderStatus`](#databaseproviderstatus)\>

Defined in: [lib/database-provider-config.ts:134](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L134)

#### Returns

`Promise`\<[`DatabaseProviderStatus`](#databaseproviderstatus)\>

***

### revealDatabaseProviderSecret()

> **revealDatabaseProviderSecret**(`providerId`): `Promise`\<\{ `authToken?`: `string` \| `null`; `connectionString?`: `string` \| `null`; `source`: `"admin"` \| `"env"` \| `null`; \}\>

Defined in: [lib/database-provider-config.ts:179](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L179)

#### Parameters

##### providerId

`"turso"` | `"postgres"`

#### Returns

`Promise`\<\{ `authToken?`: `string` \| `null`; `connectionString?`: `string` \| `null`; `source`: `"admin"` \| `"env"` \| `null`; \}\>

***

### saveDatabaseProviderConfig()

> **saveDatabaseProviderConfig**(`input`): `Promise`\<[`DatabaseProviderStatus`](#databaseproviderstatus)\>

Defined in: [lib/database-provider-config.ts:214](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L214)

#### Parameters

##### input

\{ `selectedProvider`: `"sqlite"`; \} | \{ `selectedProvider`: `"turso"`; `tursoUrl`: `string`; `tursoAuthToken?`: `string` \| `null`; \} | \{ `selectedProvider`: `"postgres"`; `postgresConnectionString?`: `string` \| `null`; \}

#### Returns

`Promise`\<[`DatabaseProviderStatus`](#databaseproviderstatus)\>

***

### resolveActiveDatabaseConnectionConfig()

> **resolveActiveDatabaseConnectionConfig**(): `Promise`\<[`ActiveDatabaseConnectionConfig`](#activedatabaseconnectionconfig)\>

Defined in: [lib/database-provider-config.ts:281](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/database-provider-config.ts#L281)

#### Returns

`Promise`\<[`ActiveDatabaseConnectionConfig`](#activedatabaseconnectionconfig)\>
