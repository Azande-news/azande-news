import { NextRequest } from "next/server";
import { getRunLog } from "../../../../lib/news-agent";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return getRunLog(request);
}