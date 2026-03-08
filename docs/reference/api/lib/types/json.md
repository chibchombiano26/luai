[**LuAI Host API Reference**](../../README.md)

***

[LuAI Host API Reference](../../README.md) / lib/types/json

# lib/types/json

## Interfaces

### JsonObject

Defined in: [lib/types/json.ts:5](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/types/json.ts#L5)

#### Indexable

\[`key`: `string`\]: [`JsonValue`](#jsonvalue)

## Type Aliases

### JsonPrimitive

> **JsonPrimitive** = `string` \| `number` \| `boolean` \| `null`

Defined in: [lib/types/json.ts:1](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/types/json.ts#L1)

***

### JsonValue

> **JsonValue** = [`JsonPrimitive`](#jsonprimitive) \| [`JsonObject`](#jsonobject) \| [`JsonValue`](#jsonvalue)[]

Defined in: [lib/types/json.ts:3](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/types/json.ts#L3)

## Functions

### isJsonObject()

> **isJsonObject**(`value`): `value is JsonObject`

Defined in: [lib/types/json.ts:9](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/types/json.ts#L9)

#### Parameters

##### value

`unknown`

#### Returns

`value is JsonObject`
