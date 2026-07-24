import { useUserStore } from "../userStore";

describe("userStore clearUserDataState", () => {
  beforeEach(() => {
    (localStorage.removeItem as jest.Mock).mockClear();
  });

  it("clears currentRoleId from localStorage so a fresh login honors the user's default role", () => {
    useUserStore.getState().clearUserDataState();

    // On the next login, verifySession reads currentRoleId and would force that role,
    // overriding the backend's default-role login. It must not survive logout.
    expect(localStorage.removeItem).toHaveBeenCalledWith("currentRoleId");
  });

  it("clears the other persisted user keys on logout", () => {
    useUserStore.getState().clearUserDataState();

    expect(localStorage.removeItem).toHaveBeenCalledWith("token");
    expect(localStorage.removeItem).toHaveBeenCalledWith("currentRole");
    expect(localStorage.removeItem).toHaveBeenCalledWith("currentWarehouse");
  });
});
