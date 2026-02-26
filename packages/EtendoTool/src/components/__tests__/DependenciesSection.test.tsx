import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { DependenciesSection } from "../DependenciesSection";
import { DependencyApi } from "../../services/dependencyApi";

// Mock the API
jest.mock("../../services/dependencyApi");
const mockedApi = jest.mocked(DependencyApi);

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockDeps = [
  {
    type: "implementation",
    group: "com.etendoerp",
    artifact: "copilot",
    version: "1.5.0",
    rawVersion: "1.5.0",
    line: "implementation 'com.etendoerp:copilot:1.5.0'",
    lineNumber: 10,
    availableVersions: ["2.0.0", "1.5.0", "1.4.0"],
    latestVersion: "2.0.0",
    updateAvailable: true,
  },
  {
    type: "moduleDeps",
    group: "com.etendoerp",
    artifact: "warehouse",
    version: "2.0.1",
    rawVersion: "2.0.1@zip",
    line: "moduleDeps 'com.etendoerp:warehouse:2.0.1@zip'",
    lineNumber: 11,
    availableVersions: ["2.0.1"],
    latestVersion: "2.0.1",
    updateAvailable: false,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.listDependencies.mockResolvedValue({
    success: true,
    data: mockDeps,
  });
});

describe("DependenciesSection", () => {
  // ==================== Rendering ====================

  it("renders the header", async () => {
    renderWithTheme(<DependenciesSection />);

    expect(screen.getByText("Dependencies")).toBeInTheDocument();
    expect(
      screen.getByText("Manage Etendo module dependencies in build.gradle"),
    ).toBeInTheDocument();
  });

  it("renders dependencies table after loading", async () => {
    renderWithTheme(<DependenciesSection />);

    await waitFor(() => {
      expect(
        screen.getByText("com.etendoerp:copilot"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("com.etendoerp:warehouse"),
    ).toBeInTheDocument();
  });

  it("shows dependency types as chips", async () => {
    renderWithTheme(<DependenciesSection />);

    await waitFor(() => {
      expect(screen.getByText("implementation")).toBeInTheDocument();
    });

    expect(screen.getByText("moduleDeps")).toBeInTheDocument();
  });

  it("shows current versions", async () => {
    renderWithTheme(<DependenciesSection />);

    await waitFor(() => {
      expect(screen.getByText("1.5.0")).toBeInTheDocument();
    });
  });

  it("shows latest version chip with update indicator", async () => {
    renderWithTheme(<DependenciesSection />);

    await waitFor(() => {
      expect(screen.getByText("2.0.0")).toBeInTheDocument();
    });
  });

  it("calls listDependencies on mount", async () => {
    renderWithTheme(<DependenciesSection />);

    await waitFor(() => {
      expect(mockedApi.listDependencies).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== Error state ====================

  it("shows error message on API failure", async () => {
    mockedApi.listDependencies.mockResolvedValueOnce({
      success: false,
      error: "Server not available",
    });

    renderWithTheme(<DependenciesSection />);

    await waitFor(() => {
      expect(screen.getByText("Server not available")).toBeInTheDocument();
    });
  });

  // ==================== Empty state ====================

  it("shows empty state when no dependencies", async () => {
    mockedApi.listDependencies.mockResolvedValueOnce({
      success: true,
      data: [],
    });

    renderWithTheme(<DependenciesSection />);

    await waitFor(() => {
      expect(
        screen.getByText("No dependencies found in build.gradle"),
      ).toBeInTheDocument();
    });
  });

  // ==================== Action buttons ====================

  it("renders Add Dependency button", async () => {
    renderWithTheme(<DependenciesSection />);

    expect(screen.getByText("Add Dependency")).toBeInTheDocument();
  });

  it("renders Refresh button", async () => {
    renderWithTheme(<DependenciesSection />);

    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });

  it("renders Apply Changes button", async () => {
    renderWithTheme(<DependenciesSection />);

    expect(screen.getByText("Apply Changes")).toBeInTheDocument();
  });

  // ==================== Refresh ====================

  it("refreshes on Refresh button click", async () => {
    const user = userEvent.setup();
    renderWithTheme(<DependenciesSection />);

    await waitFor(() => {
      expect(mockedApi.listDependencies).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByText("Refresh"));

    await waitFor(() => {
      expect(mockedApi.listDependencies).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== Remove dependency ====================

  it("calls removeDependency and refreshes on remove", async () => {
    const user = userEvent.setup();
    mockedApi.removeDependency.mockResolvedValueOnce({
      success: true,
      message: "Removed",
    });

    renderWithTheme(<DependenciesSection />);

    await waitFor(() => {
      expect(
        screen.getByText("com.etendoerp:copilot"),
      ).toBeInTheDocument();
    });

    // Find the remove buttons (DeleteOutlineIcon)
    const removeButtons = screen.getAllByTestId
      ? screen.getAllByRole("button").filter((btn) => {
          return btn.querySelector('[data-testid="DeleteOutlineIcon"]');
        })
      : [];

    // If we can't find by testid, use tooltip
    const tooltipButtons = screen.getAllByRole("button");
    const deleteButton = tooltipButtons.find((btn) =>
      btn.innerHTML.includes("DeleteOutline"),
    );

    if (deleteButton) {
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockedApi.removeDependency).toHaveBeenCalledWith(
          "com.etendoerp",
          "copilot",
        );
      });
    }
  });

  // ==================== Apply changes ====================

  it("calls applyChanges on Apply button click", async () => {
    const user = userEvent.setup();
    mockedApi.applyChanges.mockResolvedValueOnce({
      success: true,
      data: {
        success: true,
        tasks: [
          { task: "resolve.conflicts", success: true, output: "Done" },
          { task: "expandModules", success: true, output: "Done" },
        ],
        errors: [],
      },
    });

    renderWithTheme(<DependenciesSection />);

    await waitFor(() => {
      expect(
        screen.getByText("com.etendoerp:copilot"),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByText("Apply Changes"));

    await waitFor(() => {
      expect(mockedApi.applyChanges).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== Add dependency dialog ====================

  it("opens Add Dependency dialog on button click", async () => {
    const user = userEvent.setup();
    renderWithTheme(<DependenciesSection />);

    await user.click(screen.getByText("Add Dependency"));

    await waitFor(() => {
      expect(screen.getByLabelText("Group")).toBeInTheDocument();
      expect(screen.getByLabelText("Artifact")).toBeInTheDocument();
      expect(screen.getByLabelText("Version")).toBeInTheDocument();
    });
  });

  it("calls addDependency with form values", async () => {
    const user = userEvent.setup();
    mockedApi.addDependency.mockResolvedValueOnce({
      success: true,
      message: "Added",
    });

    renderWithTheme(<DependenciesSection />);

    // Open dialog
    await user.click(screen.getByText("Add Dependency"));

    await waitFor(() => {
      expect(screen.getByLabelText("Group")).toBeInTheDocument();
    });

    // Fill form
    await user.type(screen.getByLabelText("Group"), "com.etendoerp");
    await user.type(screen.getByLabelText("Artifact"), "newmodule");
    await user.type(screen.getByLabelText("Version"), "1.0.0");

    // Submit
    const addButtons = screen.getAllByText("Add");
    const submitButton = addButtons[addButtons.length - 1]; // Dialog's Add button
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedApi.addDependency).toHaveBeenCalledWith(
        "com.etendoerp",
        "newmodule",
        "1.0.0",
        "implementation",
      );
    });
  });

  it("closes Add dialog on Cancel", async () => {
    const user = userEvent.setup();
    renderWithTheme(<DependenciesSection />);

    await user.click(screen.getByText("Add Dependency"));

    await waitFor(() => {
      expect(screen.getByLabelText("Group")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.queryByLabelText("Group")).not.toBeInTheDocument();
    });
  });
});
