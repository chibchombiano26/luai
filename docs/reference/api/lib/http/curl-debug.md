[**LuAI Host API Reference**](../../README.md)

***

[LuAI Host API Reference](../../README.md) / lib/http/curl-debug

# lib/http/curl-debug

## Type Aliases

### OutboundDebugMeta

> **OutboundDebugMeta** = `object`

Defined in: [lib/http/curl-debug.ts:13](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L13)

Correlation metadata attached to outbound HTTP requests for debug logging.

#### Properties

##### requestId

> **requestId**: `string`

Defined in: [lib/http/curl-debug.ts:14](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L14)

##### startedAtMs

> **startedAtMs**: `number`

Defined in: [lib/http/curl-debug.ts:15](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L15)

##### attempt

> **attempt**: `number`

Defined in: [lib/http/curl-debug.ts:16](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L16)

## Functions

### isCurlDebugEnabled()

> **isCurlDebugEnabled**(): `boolean`

Defined in: [lib/http/curl-debug.ts:222](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L222)

#### Returns

`boolean`

***

### isDetailedHttpDebugEnabled()

> **isDetailedHttpDebugEnabled**(): `boolean`

Defined in: [lib/http/curl-debug.ts:226](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L226)

#### Returns

`boolean`

***

### buildCurlCommand()

> **buildCurlCommand**(`config`): `string`

Defined in: [lib/http/curl-debug.ts:230](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L230)

#### Parameters

##### config

`AxiosRequestConfig`

#### Returns

`string`

***

### attachOutboundDebugMeta()

> **attachOutboundDebugMeta**(`config`): [`OutboundDebugMeta`](#outbounddebugmeta)

Defined in: [lib/http/curl-debug.ts:255](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L255)

#### Parameters

##### config

`AxiosRequestConfig`

#### Returns

[`OutboundDebugMeta`](#outbounddebugmeta)

***

### logHttpRequestDetails()

> **logHttpRequestDetails**(`source`, `config`): `void`

Defined in: [lib/http/curl-debug.ts:281](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L281)

#### Parameters

##### source

`string`

##### config

`AxiosRequestConfig`

#### Returns

`void`

***

### logHttpResponseDetails()

> **logHttpResponseDetails**(`source`, `response`): `void`

Defined in: [lib/http/curl-debug.ts:310](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L310)

#### Parameters

##### source

`string`

##### response

`AxiosResponse`

#### Returns

`void`

***

### logHttpErrorDetails()

> **logHttpErrorDetails**(`source`, `error`): `void`

Defined in: [lib/http/curl-debug.ts:338](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L338)

#### Parameters

##### source

`string`

##### error

`unknown`

#### Returns

`void`

***

### logCurlRequest()

> **logCurlRequest**(`source`, `config`): `void`

Defined in: [lib/http/curl-debug.ts:381](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L381)

#### Parameters

##### source

`string`

##### config

`AxiosRequestConfig`

#### Returns

`void`

***

### logCurlResponse()

> **logCurlResponse**(`source`, `response`): `void`

Defined in: [lib/http/curl-debug.ts:387](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L387)

#### Parameters

##### source

`string`

##### response

`AxiosResponse`

#### Returns

`void`

***

### logCurlError()

> **logCurlError**(`source`, `error`): `void`

Defined in: [lib/http/curl-debug.ts:396](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/http/curl-debug.ts#L396)

#### Parameters

##### source

`string`

##### error

`unknown`

#### Returns

`void`
