import Link from "next/link";
import { Button } from "@mui/material";
import { getLanguage, t } from "@/utils/language";
import { ErrorDisplay } from "@/components/ErrorDisplay";

export default function NotFound() {
  const language = getLanguage();

  return (
    <div className="w-full min-h-full flex items-center justify-center">
      <ErrorDisplay
        title={t(language, "errors.notFound.title")}
        description={t(language, "errors.notFound.description")}>
        <Link href="/">
          <Button variant="contained">{t(language, "navigation.common.home")}</Button>
        </Link>
      </ErrorDisplay>
    </div>
  );
}
