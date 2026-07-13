export interface GitHubResponse<TData> {
  readonly data: TData;
  readonly headers: Headers;
  readonly status: number;
}

export interface GitHubRequestOptions {
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
}

export interface GitHubClientContract {
  get<TData>(path: string, options?: GitHubRequestOptions): Promise<GitHubResponse<TData>>;
}

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
