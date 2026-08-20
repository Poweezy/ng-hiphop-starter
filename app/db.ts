export { prisma } from "@/lib/prisma";
import { registerModerationHandlers } from "@/lib/moderation";

registerModerationHandlers();
