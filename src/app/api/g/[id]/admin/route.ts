import { AdminBody } from "@/lib/schema";
import { adminAction } from "@/lib/server/groups";
import { jsonError, readJson, safely } from "@/lib/server/http";

export function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return safely(async () => {
    const body = AdminBody.safeParse(await readJson(req));
    if (!body.success) return jsonError(400, "invalid");
    const result = await adminAction((await params).id, body.data.key, body.data.action);
    if (result.error) {
      const status = { forbidden: 403, not_found: 404, duplicate_name: 422, impossible: 422 }[result.error];
      return jsonError(status, result.error, result);
    }
    return Response.json(result.view);
  });
}
