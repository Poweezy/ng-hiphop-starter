-- Add userId to LyricGame for ownership tracking
ALTER TABLE "LyricGame" ADD COLUMN IF NOT EXISTS "userId" TEXT;
CREATE INDEX IF NOT EXISTS "LyricGame_userId_idx" ON "LyricGame"("userId");
