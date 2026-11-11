import { env } from "@/env";
import { db } from "@/server/db";
import { subDays } from "date-fns";
import { NextResponse } from "next/server";

const MENU_SCHEDULE_RETENTION_DAYS = 30;
// The longest rate-limit window is a day, so older rows are never counted
const AI_REQUEST_RETENTION_DAYS = 2;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const [menuSchedules, aiRequests] = await Promise.all([
    db.menuSchedule.deleteMany({
      where: { date: { lt: subDays(now, MENU_SCHEDULE_RETENTION_DAYS) } },
    }),
    db.aiRequest.deleteMany({
      where: { createdAt: { lt: subDays(now, AI_REQUEST_RETENTION_DAYS) } },
    }),
  ]);

  return NextResponse.json({
    deleted: menuSchedules.count,
    deletedAiRequests: aiRequests.count,
  });
}
