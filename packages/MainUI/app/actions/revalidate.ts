"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { logger } from "@/utils/logger";

export async function revalidateDopoProcess() {
  try {
    revalidateTag("datasource");
    revalidateTag("default");
    revalidatePath("/window");
    logger.debug?.("Cache revalidated after client-side process execution");
    return { success: true };
  } catch (e) {
    logger.warn?.("Cache revalidation failed", e);
    return { success: false };
  }
}
