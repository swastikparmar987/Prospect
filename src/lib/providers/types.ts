import {
  SearchConfig,
  SearchProviderResult,
  SearchQueryItem,
  WorkMode,
} from "../../types";

export interface SearchProviderQueryOptions {
  queryItem: SearchQueryItem;
  roundNumber: number;
  limit: number;
  offset?: number;
  workMode?: WorkMode;
  locationFilters?: string[];
  companyTargets?: string[];
  postedWithinDays?: number;
  config: SearchConfig;
  signal?: AbortSignal;
  /** Optional custom fetch implementation for unit/integration testing */
  fetchImpl?: typeof fetch;
}

export interface SearchProvider {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly scopeNote: string;
  isEnabled(config: SearchConfig): boolean;
  search(options: SearchProviderQueryOptions): Promise<SearchProviderResult>;
}

