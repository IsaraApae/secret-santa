import { ClaimBody } from "@/lib/schema";
import { claim } from "@/lib/server/groups";
import { jsonError, overLimit, readJson, safely } from "@/lib/server/http";

export function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return safely(async () => {
    if (await overLimit(req, "claim", 60)) return jsonError(429, "too_many");
    const body = ClaimBody.safeParse(await readJson(req));
    if (!body.success) return jsonError(400, "invalid");
    const result = await claim((await params).id, body.data.memberId, body.data.pin);
    if (result.error) {
      const status = { not_found: 404, too_many: 429, wrong_pin: 403 }[result.error];
      return jsonError(status, result.error);
    }
    return Response.json(result);
  });
}
