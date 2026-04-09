import type { ProviderAdapter, ProviderName } from "@/lib/drama/types";
import { dramawaveAdapter } from "@/lib/drama/providers/dramawave";
import { flickreelsAdapter } from "@/lib/drama/providers/flickreels";
import { freereelsAdapter } from "@/lib/drama/providers/freereels";
import { goodshortAdapter } from "@/lib/drama/providers/goodshort";
import { meloloAdapter } from "@/lib/drama/providers/melolo";
import { meloshortAdapter } from "@/lib/drama/providers/meloshort";
import { netshortAdapter } from "@/lib/drama/providers/netshort";
import { reelshortAdapter } from "@/lib/drama/providers/reelshort";

const providers: Record<ProviderName, ProviderAdapter> = {
  melolo: meloloAdapter,
  meloshort: meloshortAdapter,
  goodshort: goodshortAdapter,
  dramawave: dramawaveAdapter,
  reelshort: reelshortAdapter,
  freereels: freereelsAdapter,
  flickreels: flickreelsAdapter,
  netshort: netshortAdapter,
};

export function getProviderAdapter(provider: string) {
  return providers[provider as ProviderName];
}
