import { http, HttpResponse } from "msw";

import { resetGlobal } from "@/lib/global";
import { IP_DENY_LIST_URL, refreshIpDenyList } from "@/lib/ipDenyList";
import { server } from "@/mocks/node";

export async function loadDenyList(...ips: string[]) {
  resetGlobal("simon.dev/ip-deny-list");
  server.use(
    http.get(IP_DENY_LIST_URL, () => new HttpResponse(`${ips.join("\n")}\n`)),
  );
  await refreshIpDenyList();
}
