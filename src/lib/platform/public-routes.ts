import {
  GENERATED_FLOW_PACK_PUBLIC_API_ROUTES,
  GENERATED_FLOW_PACK_PUBLIC_PAGES,
} from './generated-flow-packs';

/** Params used to interpolate dynamic public flow-pack routes. */
export type PublicRouteParams = Record<string, string | number>;

function interpolateRouteTemplate(routeTemplate: string, params?: PublicRouteParams): string {
  if (!params) return routeTemplate;

  let resolved = routeTemplate;
  for (const [key, value] of Object.entries(params)) {
    resolved = resolved.replaceAll(`[${key}]`, encodeURIComponent(String(value)));
  }

  return resolved;
}

export function getFlowPackPublicPageRoute(packId: string, routeId: string): string {
  const routes = GENERATED_FLOW_PACK_PUBLIC_PAGES[
    packId as keyof typeof GENERATED_FLOW_PACK_PUBLIC_PAGES
  ] as Record<string, string> | undefined;
  const route = routes?.[routeId];
  if (!route) {
    throw new Error(`Unknown public page route "${routeId}" for pack "${packId}".`);
  }
  return route;
}

export function getFlowPackPublicApiRoute(packId: string, routeId: string): string {
  const routes = GENERATED_FLOW_PACK_PUBLIC_API_ROUTES[
    packId as keyof typeof GENERATED_FLOW_PACK_PUBLIC_API_ROUTES
  ] as Record<string, string> | undefined;
  const route = routes?.[routeId];
  if (!route) {
    throw new Error(`Unknown public api route "${routeId}" for pack "${packId}".`);
  }
  return route;
}

export function buildFlowPackPublicPagePath(
  packId: string,
  routeId: string,
  params?: PublicRouteParams
): string {
  return interpolateRouteTemplate(getFlowPackPublicPageRoute(packId, routeId), params);
}

export function buildFlowPackPublicApiPath(
  packId: string,
  routeId: string,
  params?: PublicRouteParams
): string {
  return interpolateRouteTemplate(getFlowPackPublicApiRoute(packId, routeId), params);
}
