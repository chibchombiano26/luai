[**LuAI Host API Reference**](../README.md)

***

[LuAI Host API Reference](../README.md) / lib/ai-providers

# lib/ai-providers

## Type Aliases

### AiProviderId

> **AiProviderId** = *typeof* [`AI_PROVIDER_IDS`](#ai_provider_ids)\[`number`\]

Defined in: [lib/ai-providers.ts:7](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L7)

***

### AiProviderStatus

> **AiProviderStatus** = `object`

Defined in: [lib/ai-providers.ts:9](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L9)

#### Properties

##### id

> **id**: [`AiProviderId`](#aiproviderid)

Defined in: [lib/ai-providers.ts:10](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L10)

##### label

> **label**: `Record`\<[`AppLocale`](i18n.md#applocale), `string`\>

Defined in: [lib/ai-providers.ts:11](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L11)

##### configured

> **configured**: `boolean`

Defined in: [lib/ai-providers.ts:12](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L12)

##### hasStoredSecret

> **hasStoredSecret**: `boolean`

Defined in: [lib/ai-providers.ts:13](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L13)

##### configuredVia

> **configuredVia**: `"admin"` \| `"env"` \| `null`

Defined in: [lib/ai-providers.ts:14](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L14)

##### updatedAt

> **updatedAt**: `string` \| `null`

Defined in: [lib/ai-providers.ts:15](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L15)

## Variables

### AI\_PROVIDER\_IDS

> `const` **AI\_PROVIDER\_IDS**: readonly \[`"gemini"`\]

Defined in: [lib/ai-providers.ts:5](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L5)

Supported AI provider identifiers available to the admin configuration layer.

## Functions

### isAiProviderId()

> **isAiProviderId**(`value`): `value is "gemini"`

Defined in: [lib/ai-providers.ts:55](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L55)

#### Parameters

##### value

`unknown`

#### Returns

`value is "gemini"`

***

### getAiProviderSecret()

> **getAiProviderSecret**(`providerId`): `Promise`\<\{ `secret`: `string` \| `null`; `updatedAt`: `string` \| `null`; \}\>

Defined in: [lib/ai-providers.ts:59](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L59)

#### Parameters

##### providerId

`"gemini"`

#### Returns

`Promise`\<\{ `secret`: `string` \| `null`; `updatedAt`: `string` \| `null`; \}\>

***

### saveAiProviderSecret()

> **saveAiProviderSecret**(`providerId`, `secret`): `Promise`\<[`AiProviderStatus`](#aiproviderstatus)\>

Defined in: [lib/ai-providers.ts:72](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L72)

#### Parameters

##### providerId

`"gemini"`

##### secret

`string`

#### Returns

`Promise`\<[`AiProviderStatus`](#aiproviderstatus)\>

***

### deleteAiProviderSecret()

> **deleteAiProviderSecret**(`providerId`): `Promise`\<[`AiProviderStatus`](#aiproviderstatus)\>

Defined in: [lib/ai-providers.ts:91](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L91)

#### Parameters

##### providerId

`"gemini"`

#### Returns

`Promise`\<[`AiProviderStatus`](#aiproviderstatus)\>

***

### getAiProviderStatus()

> **getAiProviderStatus**(`providerId`): `Promise`\<[`AiProviderStatus`](#aiproviderstatus) \| `null`\>

Defined in: [lib/ai-providers.ts:102](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L102)

#### Parameters

##### providerId

`"gemini"`

#### Returns

`Promise`\<[`AiProviderStatus`](#aiproviderstatus) \| `null`\>

***

### getAiProviderStatuses()

> **getAiProviderStatuses**(): `Promise`\<[`AiProviderStatus`](#aiproviderstatus)[]\>

Defined in: [lib/ai-providers.ts:118](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L118)

#### Returns

`Promise`\<[`AiProviderStatus`](#aiproviderstatus)[]\>

***

### resolveAiProviderApiKey()

> **resolveAiProviderApiKey**(`providerId`): `Promise`\<`string` \| `null`\>

Defined in: [lib/ai-providers.ts:124](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/ai-providers.ts#L124)

#### Parameters

##### providerId

`"gemini"`

#### Returns

`Promise`\<`string` \| `null`\>
