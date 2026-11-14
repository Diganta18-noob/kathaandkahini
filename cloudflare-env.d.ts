declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    ADMIN_EMAIL?: string;
    ASSETS?: Fetcher;
    BUCKET?: R2Bucket;
  }
}


