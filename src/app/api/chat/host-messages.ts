const HOST_MESSAGES = {
  FREE_TIER_LIMIT_REACHED: {
    en: 'Free tier limit reached. Upgrade your plan in Profile to continue quoting.',
    es: 'Alcanzaste el limite gratis. Actualiza tu plan desde Perfil para seguir cotizando.',
  },
  FALLBACK_RESPONSE_ERROR: {
    en: 'I could not generate a response. Please try again.',
    es: 'No pude generar una respuesta. Intenta de nuevo.',
  },
  NO_ACTIVE_FLOWS: {
    en: 'There are no active flows right now. Enable at least one card in Admin to continue.',
    es: 'No hay flujos activos en este momento. Activa al menos un card en Admin para continuar.',
  },
} as const;

export type HostMessageKey = keyof typeof HOST_MESSAGES;

export function getHostTranslation(key: HostMessageKey, isEnglish: boolean): string {
  return HOST_MESSAGES[key][isEnglish ? 'en' : 'es'];
}
