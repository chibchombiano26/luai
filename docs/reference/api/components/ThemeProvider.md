[**LuAI Host API Reference**](../README.md)

***

[LuAI Host API Reference](../README.md) / components/ThemeProvider

# components/ThemeProvider

## Interfaces

### ThemeContextValue

Defined in: [components/ThemeProvider.tsx:24](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/components/ThemeProvider.tsx#L24)

Public shape exposed by the theme context and consumed by theme-aware hooks.

#### Properties

##### theme

> **theme**: [`Theme`](../lib/theme.md#theme)

Defined in: [components/ThemeProvider.tsx:25](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/components/ThemeProvider.tsx#L25)

##### accentTheme

> **accentTheme**: [`AccentTheme`](../lib/theme.md#accenttheme)

Defined in: [components/ThemeProvider.tsx:26](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/components/ThemeProvider.tsx#L26)

##### toggleTheme()

> **toggleTheme**: () => `void`

Defined in: [components/ThemeProvider.tsx:27](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/components/ThemeProvider.tsx#L27)

###### Returns

`void`

##### setAccentTheme()

> **setAccentTheme**: (`accentTheme`) => `void`

Defined in: [components/ThemeProvider.tsx:28](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/components/ThemeProvider.tsx#L28)

###### Parameters

###### accentTheme

[`AccentTheme`](../lib/theme.md#accenttheme)

###### Returns

`void`

##### mounted

> **mounted**: `boolean`

Defined in: [components/ThemeProvider.tsx:29](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/components/ThemeProvider.tsx#L29)

## Functions

### ThemeProvider()

> **ThemeProvider**(`__namedParameters`): `Element`

Defined in: [components/ThemeProvider.tsx:34](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/components/ThemeProvider.tsx#L34)

#### Parameters

##### \_\_namedParameters

###### children

`ReactNode`

#### Returns

`Element`

***

### useThemeContext()

> **useThemeContext**(): [`ThemeContextValue`](#themecontextvalue)

Defined in: [components/ThemeProvider.tsx:79](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/components/ThemeProvider.tsx#L79)

#### Returns

[`ThemeContextValue`](#themecontextvalue)
