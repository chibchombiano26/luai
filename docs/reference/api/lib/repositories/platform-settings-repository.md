[**LuAI Host API Reference**](../../README.md)

***

[LuAI Host API Reference](../../README.md) / lib/repositories/platform-settings-repository

# lib/repositories/platform-settings-repository

## Interfaces

### PlatformSettingsRecord

Defined in: [lib/repositories/platform-settings-repository.ts:1](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/platform-settings-repository.ts#L1)

#### Properties

##### id

> **id**: `string`

Defined in: [lib/repositories/platform-settings-repository.ts:2](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/platform-settings-repository.ts#L2)

##### config

> **config**: `string`

Defined in: [lib/repositories/platform-settings-repository.ts:3](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/platform-settings-repository.ts#L3)

##### updatedAt

> **updatedAt**: `string` \| `null`

Defined in: [lib/repositories/platform-settings-repository.ts:4](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/platform-settings-repository.ts#L4)

***

### PlatformSettingsRepository

Defined in: [lib/repositories/platform-settings-repository.ts:7](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/platform-settings-repository.ts#L7)

#### Methods

##### findById()

> **findById**(`id`): `Promise`\<[`PlatformSettingsRecord`](#platformsettingsrecord) \| `null`\>

Defined in: [lib/repositories/platform-settings-repository.ts:8](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/platform-settings-repository.ts#L8)

###### Parameters

###### id

`string`

###### Returns

`Promise`\<[`PlatformSettingsRecord`](#platformsettingsrecord) \| `null`\>

##### save()

> **save**(`id`, `config`): `Promise`\<`void`\>

Defined in: [lib/repositories/platform-settings-repository.ts:9](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/platform-settings-repository.ts#L9)

###### Parameters

###### id

`string`

###### config

`string`

###### Returns

`Promise`\<`void`\>
