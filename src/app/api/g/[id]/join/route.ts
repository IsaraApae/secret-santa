import { JoinBody } from "@/lib/schema";
import { join } from "@/lib/server/groups";
import { jsonError, overLimit, readJson, safely } from "@/lib/server/http";

export function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return safely(async () => {
    if (await overLimit(req, "join", 120)) return jsonError(429, "too_many");
    const body = JoinBody.safeParse(await readJson(req));
    if (!body.success) return jsonError(400, "invalid");
    const result = await join((await params).id, body.data.name, body.data.pin);
    if ("error" in result && result.error) {
      const status = { not_found: 404, closed: 409, full: 409, duplicate_name: 422 }[result.error];
      return jsonError(status, result.error, result);
    }
    return Response.json(result);
  });
}
