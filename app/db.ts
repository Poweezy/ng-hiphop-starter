export { prisma } from "@/lib/prisma";
import { registerModerationHandlers } from "@/lib/moderation";
import { registerEmailHandlers } from "@/lib/email/handlers";

// Queue task handlers must be registered on module load so that any server
// entrypoint which touches the database (i.e. imports this module) also has
// the workers' handlers available.
registerModerationHandlers();
registerEmailHandlers();
