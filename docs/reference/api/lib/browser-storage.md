[**LuAI Host API Reference**](../README.md)

***

[LuAI Host API Reference](../README.md) / lib/browser-storage

# lib/browser-storage

## Functions

### getCompatStorageItem()

> **getCompatStorageItem**(`storage`, `primaryKey`, `legacyKeys?`): `string` \| `null`

Defined in: [lib/browser-storage.ts:1](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/browser-storage.ts#L1)

#### Parameters

##### storage

`Storage`

##### primaryKey

`string`

##### legacyKeys?

readonly `string`[] = `[]`

#### Returns

`string` \| `null`

***

### hasCompatStorageKey()

> **hasCompatStorageKey**(`storage`, `primaryKey`, `legacyKeys?`): `boolean`

Defined in: [lib/browser-storage.ts:22](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/browser-storage.ts#L22)

#### Parameters

##### storage

`Storage`

##### primaryKey

`string`

##### legacyKeys?

readonly `string`[] = `[]`

#### Returns

`boolean`

***

### setCompatStorageItem()

> **setCompatStorageItem**(`storage`, `primaryKey`, `value`, `legacyKeys?`): `void`

Defined in: [lib/browser-storage.ts:39](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/browser-storage.ts#L39)

#### Parameters

##### storage

`Storage`

##### primaryKey

`string`

##### value

`string`

##### legacyKeys?

readonly `string`[] = `[]`

#### Returns

`void`

***

### removeCompatStorageItem()

> **removeCompatStorageItem**(`storage`, `primaryKey`, `legacyKeys?`): `void`

Defined in: [lib/browser-storage.ts:52](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/browser-storage.ts#L52)

#### Parameters

##### storage

`Storage`

##### primaryKey

`string`

##### legacyKeys?

readonly `string`[] = `[]`

#### Returns

`void`
