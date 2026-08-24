-- Remove the LyricGame model and its relation to LyricCompetition.
-- This is a destructive migration: all stored lyric-game entries are deleted.

DROP INDEX IF EXISTS "LyricGame_is_active_idx";
DROP INDEX IF EXISTS "LyricGame_createdAt_idx";
DROP INDEX IF EXISTS "LyricGame_competitionId_idx";
DROP INDEX IF EXISTS "LyricGame_userId_idx";

DROP TABLE IF EXISTS "LyricGame";
