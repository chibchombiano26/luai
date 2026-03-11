import { PublicMarketAssetExplorer } from '../components/PublicMarketAssetExplorer';

export default async function MarketAssetPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  return <PublicMarketAssetExplorer locale="es" initialSymbol={symbol} />;
}
