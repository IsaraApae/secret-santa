import { getPublicGroup } from "@/lib/server/groups";
import { jsonError, safely } from "@/lib/server/http";

export function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return safely(async () => {
    const group = await getPublicGroup((await params).id);
    return group ? Response.json(group) : jsonError(404, "not_found");
  });
}
