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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { render, screen } from "@testing-library/react";
import CTABanner from "@/screens/Home/widgets/CTABanner";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("CTABanner", () => {
  it("uses the banner tokens, which keep their contrast on the dark banner in both themes", () => {
    render(<CTABanner />);

    expect(screen.getByText("dashboard.ctaBanner.badge")).toHaveClass("text-(--ui-banner-accent)");
    expect(screen.getByRole("link")).toHaveClass("bg-(--ui-banner-cta)", "hover:bg-(--ui-banner-cta-hover)");
    // Light button with dark text: the white-on-violet one blended into the dark banner.
    expect(screen.getByRole("link")).toHaveClass("text-(--ui-banner-cta-fg)");
    expect(screen.getByRole("link")).not.toHaveClass("text-white");
  });
});
