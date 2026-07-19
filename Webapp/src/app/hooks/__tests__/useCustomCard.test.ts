import { renderHook, waitFor } from "@testing-library/react";
import { useCustomCard } from "../useCustomCard";
import { fetchImageAsBlob } from "../useRemoteImage";
import { createCardWithText } from "../../utils/createCardWithText";

jest.mock("../useRemoteImage", () => ({
  fetchImageAsBlob: jest.fn(),
}));

jest.mock("../../utils/createCardWithText", () => ({
  createCardWithText: jest.fn(),
}));

jest.mock("../../utils/blob", () => ({
  formatDate: jest.fn(() => "15.07.2026"),
}));

const mockFetchImageAsBlob = fetchImageAsBlob as jest.MockedFunction<typeof fetchImageAsBlob>;
const mockCreateCardWithText = createCardWithText as jest.MockedFunction<typeof createCardWithText>;

describe("useCustomCard Hook", () => {
  const mockTemplateBlob = new Blob(["template"], { type: "image/png" });
  const mockCardBlob = new Blob(["card"], { type: "image/png" });
  const mockEditText = "Custom message";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_CARD_TEMPLATE_URL = "https://example.com/template.png";
    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
  });

  describe("Initial State", () => {
    it("should have loading true initially", () => {
      mockFetchImageAsBlob.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useCustomCard("Test"));
      expect(result.current.loading).toBe(true);
      expect(result.current.customCardBlob).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it("should start fetching template on mount", () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      renderHook(() => useCustomCard("Test"));
      expect(mockFetchImageAsBlob).toHaveBeenCalledWith("https://example.com/template.png");
    });
  });

  describe("Successful Card Generation", () => {
    it("should fetch template and generate custom card", async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      const { result } = renderHook(() => useCustomCard(mockEditText));
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.customCardBlob).toBe(mockCardBlob);
      expect(result.current.error).toBe(null);
    });

    it("should call createCardWithText with correct parameters", async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      const customText = "My custom text";
      renderHook(() => useCustomCard(customText));

      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalled();
      });

      const callArgs = mockCreateCardWithText.mock.calls[0];
      expect(callArgs[0]).toBe("blob:mock-url");
      expect(callArgs[1]).toBe(customText);
      expect(callArgs[2]).toBe("15.07.2026");
    });

    it("should set loading to false after successful generation", async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      const { result } = renderHook(() => useCustomCard("Test"));
      expect(result.current.loading).toBe(true);
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("Template Fetch Error", () => {
    it("should set error when template fetch fails", async () => {
      const errorMessage = "Failed to fetch template";
      mockFetchImageAsBlob.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCustomCard("Test"));
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.customCardBlob).toBe(null);
    });

    it("should not call createCardWithText when template fetch fails", async () => {
      mockFetchImageAsBlob.mockRejectedValue(new Error("Fetch failed"));
      renderHook(() => useCustomCard("Test"));
      await waitFor(() => {
        expect(mockFetchImageAsBlob).toHaveBeenCalled();
      });
      expect(mockCreateCardWithText).not.toHaveBeenCalled();
    });
  });

  describe("Card Creation Error", () => {
    it("should set error when card creation fails", async () => {
      const errorMessage = "Failed to create card";
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCustomCard("Test"));
      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
      expect(result.current.customCardBlob).toBe(null);
    });
  });

  describe("Edit Text Updates", () => {
    it("should regenerate card when edit text changes", async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      const { rerender } = renderHook(({ text }) => useCustomCard(text), {
        initialProps: { text: "Initial text" },
      });

      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalledTimes(1);
      });
      rerender({ text: "Updated text" });
      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalledTimes(2);
      });

      const lastCallArgs = mockCreateCardWithText.mock.calls[1];
      expect(lastCallArgs[1]).toBe("Updated text");
    });
  });

  describe("Blob URL Management", () => {
    it("should create object URL from template blob", async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      renderHook(() => useCustomCard("Test"));
      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalled();
      });
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockTemplateBlob);
    });

    it("should revoke object URL after card creation", async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      renderHook(() => useCustomCard("Test"));
      await waitFor(() => {
        expect(mockCreateCardWithText).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
      });
    });
  });

  describe("Return Value", () => {
    it("should return object with correct properties", async () => {
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      mockCreateCardWithText.mockResolvedValue(mockCardBlob);

      const { result } = renderHook(() => useCustomCard("Test"));
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current).toHaveProperty("customCardBlob");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
    });
  });

  describe("Environment Variable", () => {
    it("should use NEXT_PUBLIC_CARD_TEMPLATE_URL from environment", () => {
      // Env is set at top of file before module load
      mockFetchImageAsBlob.mockResolvedValue(mockTemplateBlob);
      renderHook(() => useCustomCard("Test"));
      expect(mockFetchImageAsBlob).toHaveBeenCalledWith("https://example.com/template.png");
    });
  });
});
