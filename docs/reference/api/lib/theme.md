[**LuAI Host API Reference**](../README.md)

***

[LuAI Host API Reference](../README.md) / lib/theme

# lib/theme

## Type Aliases

### Theme

> **Theme** = `"light"` \| `"dark"`

Defined in: [lib/theme.ts:1](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/theme.ts#L1)

***

### AccentTheme

> **AccentTheme** = `"blue"` \| `"emerald"` \| `"rose"` \| `"amber"` \| `"violet"` \| `"cyan"` \| `"indigo"` \| `"teal"`

Defined in: [lib/theme.ts:2](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/theme.ts#L2)

## Variables

### ACCENT\_THEMES

> `const` **ACCENT\_THEMES**: [`AccentTheme`](#accenttheme)[]

Defined in: [lib/theme.ts:16](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/theme.ts#L16)

## Functions

### readStoredTheme()

> **readStoredTheme**(): [`Theme`](#theme) \| `null`

Defined in: [lib/theme.ts:31](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/theme.ts#L31)

#### Returns

[`Theme`](#theme) \| `null`

***

### writeStoredTheme()

> **writeStoredTheme**(`theme`): `void`

Defined in: [lib/theme.ts:40](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/theme.ts#L40)

#### Parameters

##### theme

[`Theme`](#theme)

#### Returns

`void`

***

### readStoredAccentTheme()

> **readStoredAccentTheme**(): [`AccentTheme`](#accenttheme) \| `null`

Defined in: [lib/theme.ts:48](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/theme.ts#L48)

#### Returns

[`AccentTheme`](#accenttheme) \| `null`

***

### writeStoredAccentTheme()

> **writeStoredAccentTheme**(`accentTheme`): `void`

Defined in: [lib/theme.ts:57](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/theme.ts#L57)

#### Parameters

##### accentTheme

[`AccentTheme`](#accenttheme)

#### Returns

`void`

***

### getSystemTheme()

> **getSystemTheme**(): [`Theme`](#theme)

Defined in: [lib/theme.ts:65](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/theme.ts#L65)

#### Returns

[`Theme`](#theme)

***

### applyTheme()

> **applyTheme**(`theme`): `void`

Defined in: [lib/theme.ts:73](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/theme.ts#L73)

#### Parameters

##### theme

[`Theme`](#theme)

#### Returns

`void`

***

### applyAccentTheme()

> **applyAccentTheme**(`accentTheme`): `void`

Defined in: [lib/theme.ts:89](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/theme.ts#L89)

#### Parameters

##### accentTheme

[`AccentTheme`](#accenttheme)

#### Returns

`void`

***

### resolveInitialTheme()

> **resolveInitialTheme**(): [`Theme`](#theme)

Defined in: [lib/theme.ts:101](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/theme.ts#L101)

#### Returns

[`Theme`](#theme)

***

### resolveInitialAccentTheme()

> **resolveInitialAccentTheme**(): [`AccentTheme`](#accenttheme)

Defined in: [lib/theme.ts:105](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/theme.ts#L105)

#### Returns

[`AccentTheme`](#accenttheme)
