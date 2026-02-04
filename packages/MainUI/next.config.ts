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

import analyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import { generateAppVersion } from "./utils/version";

const DEBUG_MODE = process.env.DEBUG_MODE === "true" || process.env.NODE_ENV === "development";
const ANALYZE = process.env.ANALYZE === "true";

const APP_VERSION = generateAppVersion();

const nextConfig: NextConfig = {
  transpilePackages: ["@mui/material", "@mui/system", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
  modularizeImports: {
    "@mui/material": {
      transform: "@mui/material/{{member}}",
    },
    "@mui/icons-material": {
      transform: "@mui/icons-material/{{member}}",
    },
  },
  reactStrictMode: false,
  cleanDistDir: false,
  output: "standalone",
  compiler: {
    removeConsole: !DEBUG_MODE,
  },
  compress: !DEBUG_MODE,
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
    CSRF_RECOVERY_ENABLED: "true",
  },

  webpack(config) {
    config.optimization = {
      ...config.optimization,
      minimize: !DEBUG_MODE,
    };

    const fileLoaderRule = config.module.rules.find((rule: { test: { toString: () => string | string[] } }) =>
      rule.test?.toString().includes("svg")
    );

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    config.module.rules.push(
      {
        test: /\.svg$/i,
        resourceQuery: /url/,
        type: "asset/resource",
        generator: {
          filename: "static/media/[name].[hash][ext]",
        },
      },
      {
        test: /\.svg$/i,
        resourceQuery: { not: [/url/] },
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              icon: true,
            },
          },
        ],
      }
    );

    if (config.optimization?.minimizer) {
      for (const plugin of config.optimization.minimizer) {
        if (plugin.options?.terserOptions) {
          plugin.options.terserOptions.compress = {
            ...plugin.options.terserOptions.compress,
            drop_console: !DEBUG_MODE,
          };
        }
      }
    }

    return config;
  },
};

export default analyzer({ enabled: ANALYZE, logLevel: "info", openAnalyzer: ANALYZE })(nextConfig);
