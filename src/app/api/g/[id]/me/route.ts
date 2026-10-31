import { MeBody } from "@/lib/schema";
import { memberAction } from "@/lib/server/groups";
import { jsonError, readJson, safely } from "@/lib/server/http";

export function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return safely(async () => {
    const body = MeBody.safeParse(await readJson(req));
    if (!body.success) return jsonError(400, "invalid");
    const view = await memberAction((await params).id, body.data.memberId, body.data.token, body.data.action);
    return view ? Response.json(view) : jsonError(401, "signed_out");
  });
}
