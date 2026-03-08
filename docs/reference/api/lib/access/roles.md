[**LuAI Host API Reference**](../../README.md)

***

[LuAI Host API Reference](../../README.md) / lib/access/roles

# lib/access/roles

## Type Aliases

### AppUserRole

> **AppUserRole** = *typeof* [`APP_USER_ROLES`](#app_user_roles)\[`number`\]

Defined in: [lib/access/roles.ts:3](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/access/roles.ts#L3)

## Variables

### APP\_USER\_ROLES

> `const` **APP\_USER\_ROLES**: readonly \[`"admin"`, `"operator"`, `"viewer"`\]

Defined in: [lib/access/roles.ts:1](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/access/roles.ts#L1)

## Functions

### isAppUserRole()

> **isAppUserRole**(`value`): value is "admin" \| "operator" \| "viewer"

Defined in: [lib/access/roles.ts:5](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/access/roles.ts#L5)

#### Parameters

##### value

`unknown`

#### Returns

value is "admin" \| "operator" \| "viewer"

***

### resolveAssignedAppUserRoleFromMetadata()

> **resolveAssignedAppUserRoleFromMetadata**(`publicMetadata`): `"admin"` \| `"operator"` \| `"viewer"` \| `null`

Defined in: [lib/access/roles.ts:68](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/access/roles.ts#L68)

#### Parameters

##### publicMetadata

`unknown`

#### Returns

`"admin"` \| `"operator"` \| `"viewer"` \| `null`

***

### resolveAppUserRoleFromMetadata()

> **resolveAppUserRoleFromMetadata**(`publicMetadata`): `"admin"` \| `"operator"` \| `"viewer"` \| `null`

Defined in: [lib/access/roles.ts:78](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/access/roles.ts#L78)

#### Parameters

##### publicMetadata

`unknown`

#### Returns

`"admin"` \| `"operator"` \| `"viewer"` \| `null`

***

### hasAssignedAppGroupInMetadata()

> **hasAssignedAppGroupInMetadata**(`metadata`): `boolean`

Defined in: [lib/access/roles.ts:87](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/access/roles.ts#L87)

#### Parameters

##### metadata

`unknown`

#### Returns

`boolean`

***

### hasAssignedAppGroup()

> **hasAssignedAppGroup**(`metadata`): `boolean`

Defined in: [lib/access/roles.ts:124](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/access/roles.ts#L124)

#### Parameters

##### metadata

`unknown`

#### Returns

`boolean`

***

### hasAssignedAppAccessInMetadata()

> **hasAssignedAppAccessInMetadata**(`metadata`): `boolean`

Defined in: [lib/access/roles.ts:132](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/access/roles.ts#L132)

#### Parameters

##### metadata

`unknown`

#### Returns

`boolean`

***

### hasAssignedAppAccess()

> **hasAssignedAppAccess**(`metadata`): `boolean`

Defined in: [lib/access/roles.ts:136](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/access/roles.ts#L136)

#### Parameters

##### metadata

`unknown`

#### Returns

`boolean`

***

### isAdminRole()

> **isAdminRole**(`role`): `boolean`

Defined in: [lib/access/roles.ts:140](https://github.com/chibchombiano26/luai/blob/3d28abc3baf13472fd0dae1b3be11c8b0357945f/src/lib/access/roles.ts#L140)

#### Parameters

##### role

`"admin"` | `"operator"` | `"viewer"` | `null`

#### Returns

`boolean`
