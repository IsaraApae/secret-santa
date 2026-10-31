import { CreateBody } from "@/lib/schema";
import { createGroup } from "@/lib/server/groups";
import { jsonError, overLimit, readJson, safely } from "@/lib/server/http";

export function POST(req: Request) {
  return safely(async () => {
    if (await overLimit(req, "create", 30)) return jsonError(429, "too_many");
    const body = CreateBody.safeParse(await readJson(req));
    if (!body.success) return jsonError(400, "invalid");
    return Response.json(await createGroup(body.data));
  });
}
