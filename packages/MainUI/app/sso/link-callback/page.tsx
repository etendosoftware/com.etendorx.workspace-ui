"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";

// Middleware redirects here with ?access_token= after the user authorizes linking.
// We forward it (with the logged-in JWT) to the authenticated /sso/link endpoint,
// which rides the existing /api/erp proxy → /sws/com.etendoerp.metadata.meta/sso/link.
export default function SSOLinkCallback() {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState(false);

  useEffect(() => {
    const accessToken = new URLSearchParams(window.location.search).get("access_token");
    const jwt = localStorage.getItem("token");
    if (!accessToken || !jwt) {
      router.replace("/");
      return;
    }

    fetch("/api/erp/meta/sso/link", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ accessToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`link failed: ${res.status}`);
        toast.success(t("navigation.profile.linkSuccess"));
        router.replace("/");
      })
      .catch((e) => {
        logger.warn("SSO link error:", e);
        toast.error(t("navigation.profile.linkError"));
        setError(true);
      });
  }, [router, t]);

  return (
    <div className="flex flex-1 items-center justify-center p-8 text-(--color-transparent-neutral-70)">
      {error ? t("navigation.profile.linkError") : t("navigation.profile.linking")}
    </div>
  );
}
