/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Metadata } from "next/types";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import ApiProviderWrapper from "@/contexts/api/wrapper";
import "./styles/global.css";
import ThemeProvider from "@workspaceui/componentlibrary/src/components/ThemeProvider";
import LanguageProvider from "@/contexts/language";
import LoadingProvider from "@/contexts/loading";
import UserProvider from "@/contexts/user";
import { DatasourceProvider } from "@/contexts/datasourceContext";
import MetadataProvider from "@/contexts/metadata";
import WindowProvider from "@/contexts/window";
import Layout from "@/components/layout";
import { DENSITY_KEY } from "@/utils/accessibility/constants";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Etendo",
  applicationName: "Etendo",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const setInitialDensityScript = `
    (function() {
      try {
        const className = localStorage.getItem("${DENSITY_KEY}");
        if (className) {
          var parsed = JSON.parse(className);
          document.documentElement.classList.add(parsed);
          try {
            var maxAge = 60 * 60 * 24 * 365; // 1 year
            document.cookie = "${DENSITY_KEY}=" + encodeURIComponent(parsed) + "; path=/; max-age=" + maxAge;
          } catch (_) {}
        }
      } catch(e) {}
    })();
  `;
  // Read density from cookie on the server to avoid SSR/CSR mismatch
  const cookieStore = await cookies();
  const density = cookieStore.get(DENSITY_KEY)?.value ?? "";
  const htmlClass = [inter.variable, density].filter(Boolean).join(" ");

  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: 
         Apply the density class as early as possible to avoid layout shift. 
         This script is 100% safe because it doesn't evaluate user input. */}
        <script dangerouslySetInnerHTML={{ __html: setInitialDensityScript }} />
      </head>
      <body>
        <ApiProviderWrapper data-testid="ApiProviderWrapper__ba7569">
          <ThemeProvider data-testid="ThemeProvider__ba7569">
            <LanguageProvider data-testid="LanguageProvider__ba7569">
              <UserProvider data-testid="UserProvider__ba7569">
                <DatasourceProvider data-testid="DatasourceProvider__ba7569">
                  <WindowProvider>
                    <MetadataProvider data-testid="MetadataProvider__ba7569">
                      <LoadingProvider data-testid="LoadingProvider__ba7569">
                        <Layout data-testid="Layout__ba7569">{children}</Layout>
                      </LoadingProvider>
                    </MetadataProvider>
                  </WindowProvider>
                </DatasourceProvider>
              </UserProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ApiProviderWrapper>
      </body>
    </html>
  );
}
