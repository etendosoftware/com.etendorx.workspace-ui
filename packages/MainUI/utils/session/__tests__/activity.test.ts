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

import { subscribeToUserActivity, USER_ACTIVITY_EVENTS } from "../activity";

describe("session/activity", () => {
  let addSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;

  beforeEach(() => {
    addSpy = jest.spyOn(window, "addEventListener");
    removeSpy = jest.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("registers every activity event as passive and in the capture phase", () => {
    const onActivity = jest.fn();

    subscribeToUserActivity(onActivity);

    for (const eventName of USER_ACTIVITY_EVENTS) {
      expect(addSpy).toHaveBeenCalledWith(eventName, onActivity, { passive: true, capture: true });
    }
    expect(addSpy).toHaveBeenCalledTimes(USER_ACTIVITY_EVENTS.length);
  });

  it.each(USER_ACTIVITY_EVENTS)("reports %s as user activity", (eventName) => {
    const onActivity = jest.fn();
    const unsubscribe = subscribeToUserActivity(onActivity);

    window.dispatchEvent(new Event(eventName));

    expect(onActivity).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("removes every listener on unsubscribe", () => {
    const onActivity = jest.fn();

    subscribeToUserActivity(onActivity)();

    for (const eventName of USER_ACTIVITY_EVENTS) {
      expect(removeSpy).toHaveBeenCalledWith(eventName, onActivity, { passive: true, capture: true });
    }
  });

  it("stops reporting activity after unsubscribing", () => {
    const onActivity = jest.fn();
    const unsubscribe = subscribeToUserActivity(onActivity);

    unsubscribe();
    window.dispatchEvent(new Event("keydown"));

    expect(onActivity).not.toHaveBeenCalled();
  });

  // Network traffic must never count as activity, otherwise background polling would keep an
  // abandoned session alive forever.
  it("does not treat non-input events as user activity", () => {
    const onActivity = jest.fn();
    const unsubscribe = subscribeToUserActivity(onActivity);

    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("mousemove"));
    window.dispatchEvent(new Event("message"));

    expect(onActivity).not.toHaveBeenCalled();
    unsubscribe();
  });
});
