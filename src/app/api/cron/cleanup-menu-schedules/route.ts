import { env } from "@/env";
import { db } from "@/server/db";
import { subDays } from "date-fns";
import { NextResponse } from "next/server";

const MENU_SCHEDULE_RETENTION_DAYS = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count } = await db.menuSchedule.deleteMany({
    where: {
      date: {
        lt: subDays(new Date(), MENU_SCHEDULE_RETENTION_DAYS),
      },
    },
  });

  return NextResponse.json({ deleted: count });
}
