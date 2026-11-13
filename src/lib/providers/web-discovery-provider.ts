import { TavilySearchProvider } from "./tavily-provider";

/**
 * GeneralWebDiscoveryProvider is maintained as a direct subclass/alias of TavilySearchProvider
 * for complete backwards compatibility across the Prospect search provider architecture.
 */
export class GeneralWebDiscoveryProvider extends TavilySearchProvider {
  readonly id = "web_discovery";
  readonly displayName = "General Web Discovery (Tavily Real-Time Adapter)";
}
