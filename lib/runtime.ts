type Parameter = string | number;
type Query = { sql: string; params: string[] };
type Result<T> = { success: boolean; results: T[] };

function createDatabase(accountId: string, databaseId: string, token: string) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}/query`;

  async function query<T>(body: Query | { batch: Query[] }, expectedCount: number) {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("D1 query failed");

    const data = (await response.json()) as {
      success: boolean;
      result?: Result<T>[];
    };
    if (
      !data.success ||
      data.result?.length !== expectedCount ||
      data.result.some((row) => !row.success)
    ) {
      throw new Error("D1 query failed");
    }
    return data.result;
  }

  function statement(sql: string, params: string[] = []) {
    const request = { sql, params };
    return {
      request,
      bind: (...values: Parameter[]) => statement(sql, values.map(String)),
      all: async <T>() => (await query<T>(request, 1))[0],
      run: async () => (await query(request, 1))[0],
    };
  }

  return {
    prepare: statement,
    batch: <T>(statements: ReturnType<typeof statement>[]) =>
      query<T>(
        { batch: statements.map((item) => item.request) },
        statements.length,
      ),
  };
}

export const usesVercelAuth: boolean = true;

export const env = {
  get ADMIN_EMAIL() {
    return process.env.ADMIN_EMAIL;
  },
  get DB() {
    const { CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_D1_API_TOKEN } = process.env;
    if (!CF_ACCOUNT_ID || !CF_D1_DATABASE_ID || !CF_D1_API_TOKEN) {
      return undefined;
    }
    return createDatabase(CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_D1_API_TOKEN);
  },
};
