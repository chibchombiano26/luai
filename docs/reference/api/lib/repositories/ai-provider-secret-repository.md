[**LuAI Host API Reference**](../../README.md)

***

[LuAI Host API Reference](../../README.md) / lib/repositories/ai-provider-secret-repository

# lib/repositories/ai-provider-secret-repository

## Interfaces

### AiProviderSecretRecord

Defined in: [lib/repositories/ai-provider-secret-repository.ts:1](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/ai-provider-secret-repository.ts#L1)

#### Properties

##### providerId

> **providerId**: `string`

Defined in: [lib/repositories/ai-provider-secret-repository.ts:2](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/ai-provider-secret-repository.ts#L2)

##### secret

> **secret**: `string` \| `null`

Defined in: [lib/repositories/ai-provider-secret-repository.ts:3](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/ai-provider-secret-repository.ts#L3)

##### updatedAt

> **updatedAt**: `string` \| `null`

Defined in: [lib/repositories/ai-provider-secret-repository.ts:4](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/ai-provider-secret-repository.ts#L4)

***

### AiProviderSecretRepository

Defined in: [lib/repositories/ai-provider-secret-repository.ts:7](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/ai-provider-secret-repository.ts#L7)

#### Methods

##### findByProviderId()

> **findByProviderId**(`providerId`): `Promise`\<[`AiProviderSecretRecord`](#aiprovidersecretrecord) \| `null`\>

Defined in: [lib/repositories/ai-provider-secret-repository.ts:8](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/ai-provider-secret-repository.ts#L8)

###### Parameters

###### providerId

`string`

###### Returns

`Promise`\<[`AiProviderSecretRecord`](#aiprovidersecretrecord) \| `null`\>

##### save()

> **save**(`providerId`, `secret`): `Promise`\<`void`\>

Defined in: [lib/repositories/ai-provider-secret-repository.ts:9](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/ai-provider-secret-repository.ts#L9)

###### Parameters

###### providerId

`string`

###### secret

`string`

###### Returns

`Promise`\<`void`\>

##### delete()

> **delete**(`providerId`): `Promise`\<`void`\>

Defined in: [lib/repositories/ai-provider-secret-repository.ts:10](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/repositories/ai-provider-secret-repository.ts#L10)

###### Parameters

###### providerId

`string`

###### Returns

`Promise`\<`void`\>
