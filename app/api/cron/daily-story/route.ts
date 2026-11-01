import { NextRequest } from "next/server";
import { runDailyStory } from "../../../../lib/news-agent";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return runDailyStory(request);
}