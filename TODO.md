# TODO (NG HipHop)

## Current status
- ✅ Upstash-based shared rate limiter integrated into `app/api/quotes/route.ts`
- ✅ `lib/ratelimit.ts` updated for TS typing
- ✅ `tsconfig.json` target set to ES2019
- ✅ Admin SongsPanel “Set Active” green styling updated
- ⚠️ Dev runtime currently failing `POST /api/quotes` with 500 due to missing env vars `UPSTASH_REDIS_REST_URL`

## Next steps
1. Add required env vars to the project `.env` (or your Next env configuration):
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
2. Restart dev server.
3. Smoke test:
   - `POST /api/quotes` until limit exceeded -> verify HTTP 429 and message.

## Optional (if you want local dev without Upstash)
4. Implement dev fallback in `lib/ratelimit.ts` (allow all when env vars missing).

