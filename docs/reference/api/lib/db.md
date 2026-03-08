[**LuAI Host API Reference**](../README.md)

***

[LuAI Host API Reference](../README.md) / lib/db

# lib/db

## Interfaces

### DbInterface

Defined in: [lib/db.ts:12](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/db.ts#L12)

#### Properties

##### get()

> **get**: (`sql`, `params?`) => `Promise`\<`unknown`\>

Defined in: [lib/db.ts:13](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/db.ts#L13)

###### Parameters

###### sql

`string`

###### params?

[`DbParams`](#dbparams)

###### Returns

`Promise`\<`unknown`\>

##### all()

> **all**: (`sql`, `params?`) => `Promise`\<`unknown`[]\>

Defined in: [lib/db.ts:14](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/db.ts#L14)

###### Parameters

###### sql

`string`

###### params?

[`DbParams`](#dbparams)

###### Returns

`Promise`\<`unknown`[]\>

##### run()

> **run**: (`sql`, `params?`) => `Promise`\<`unknown`\>

Defined in: [lib/db.ts:15](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/db.ts#L15)

###### Parameters

###### sql

`string`

###### params?

[`DbParams`](#dbparams)

###### Returns

`Promise`\<`unknown`\>

##### exec()

> **exec**: (`sql`) => `Promise`\<`void`\>

Defined in: [lib/db.ts:16](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/db.ts#L16)

###### Parameters

###### sql

`string`

###### Returns

`Promise`\<`void`\>

## Type Aliases

### DbParam

> **DbParam** = `string` \| `number` \| `boolean` \| `bigint` \| `null` \| `Uint8Array` \| `ArrayBuffer`

Defined in: [lib/db.ts:9](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/db.ts#L9)

***

### DbParams

> **DbParams** = [`DbParam`](#dbparam)[]

Defined in: [lib/db.ts:10](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/db.ts#L10)

## Functions

### resetDbInstance()

> **resetDbInstance**(): `void`

Defined in: [lib/db.ts:22](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/db.ts#L22)

#### Returns

`void`

***

### getDb()

> **getDb**(): `Promise`\<[`DbInterface`](#dbinterface)\>

Defined in: [lib/db.ts:27](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/db.ts#L27)

#### Returns

`Promise`\<[`DbInterface`](#dbinterface)\>
