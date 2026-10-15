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

import { getOrigin, readAlertCountMessage } from "../readAlertCountMessage";
import { ALERT_COUNT_MESSAGE_ACTION, ALERT_COUNT_MESSAGE_TYPE } from "../constants";

const CLASSIC_ORIGIN = "http://localhost:8080";

const buildMessage = (data: unknown, origin = CLASSIC_ORIGIN) => new MessageEvent("message", { data, origin });

const alertCountData = (cnt: unknown) => ({
  type: ALERT_COUNT_MESSAGE_TYPE,
  action: ALERT_COUNT_MESSAGE_ACTION,
  payload: { cnt },
});

describe("getOrigin", () => {
  it.each([
    ["an absolute URL", "http://localhost:8080/etendodev", CLASSIC_ORIGIN],
    ["an invalid URL", "not a url", ""],
    ["a missing URL", undefined, ""],
  ])("resolves %s", (_case, url, expected) => {
    expect(getOrigin(url)).toBe(expected);
  });
});

describe("readAlertCountMessage", () => {
  it("returns the count of a valid message from the classic origin", () => {
    expect(readAlertCountMessage(buildMessage(alertCountData(2)), CLASSIC_ORIGIN)).toBe(2);
  });

  it.each([
    ["it comes from another origin", buildMessage(alertCountData(2), "http://evil.test"), CLASSIC_ORIGIN],
    ["the classic origin is unknown", buildMessage(alertCountData(2)), ""],
    ["the type does not match", buildMessage({ ...alertCountData(2), type: "fromForm" }), CLASSIC_ORIGIN],
    ["the action does not match", buildMessage({ ...alertCountData(2), action: "closeModal" }), CLASSIC_ORIGIN],
    ["the count is not a number", buildMessage(alertCountData("2")), CLASSIC_ORIGIN],
    ["the message has no data", buildMessage(null), CLASSIC_ORIGIN],
    [
      "the message has no payload",
      buildMessage({ type: ALERT_COUNT_MESSAGE_TYPE, action: ALERT_COUNT_MESSAGE_ACTION }),
      CLASSIC_ORIGIN,
    ],
  ])("returns null when %s", (_case, event, origin) => {
    expect(readAlertCountMessage(event, origin)).toBeNull();
  });
});
