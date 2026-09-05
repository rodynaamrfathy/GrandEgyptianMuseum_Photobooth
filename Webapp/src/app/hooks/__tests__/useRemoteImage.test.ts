import { renderHook, waitFor } from "@testing-library/react";
import {
  getImageFromUrl,
  fetchImageAsBlob,
  fetchImageFromAWSAPI,
  useRemoteImage,
} from "../useRemoteImage";

const mockFetch = global.fetch as jest.Mock;

describe("useRemoteImage Hook and Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as { location?: unknown }).location;
    (window as { location?: unknown }).location = { search: "" } as Location;
    process.env.NEXT_PUBLIC_AWS_API_BASE_URL = "https://api.example.com";
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getImageFromUrl Utility", () => {
    it("should extract image parameter from URL", () => {
      (window as { location?: unknown }).location = {
        search: "?image=kiosk1_filter1_123456",
      } as Location;
      expect(getImageFromUrl()).toBe("kiosk1_filter1_123456");
    });

    it("should return null when image parameter is not present", () => {
      (window as { location?: unknown }).location = { search: "?other=value" } as Location;
      expect(getImageFromUrl()).toBe(null);
    });

    it("should return null when no query parameters", () => {
      (window as { location?: unknown }).location = { search: "" } as Location;
      expect(getImageFromUrl()).toBe(null);
    });

    it("should handle multiple query parameters", () => {
      (window as { location?: unknown }).location = {
        search: "?foo=bar&image=kiosk1_filter1_123456&baz=qux",
      } as Location;
      expect(getImageFromUrl()).toBe("kiosk1_filter1_123456");
    });

    it("should return null in SSR environment", () => {
      const originalWindow = global.window;
      delete (global as { window?: unknown }).window;
      expect(getImageFromUrl()).toBe(null);
      (global as { window?: unknown }).window = originalWindow;
    });
  });

  describe("fetchImageAsBlob Utility", () => {
    it("should fetch and return blob from URL", async () => {
      const mockBlob = new Blob(["image data"], { type: "image/jpeg" });
      mockFetch.mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(mockBlob) });
      const result = await fetchImageAsBlob("https://example.com/image.jpg");
      expect(result).toBe(mockBlob);
      expect(mockFetch).toHaveBeenCalledWith("https://example.com/image.jpg");
    });

    it("should throw error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(fetchImageAsBlob("https://example.com/missing.jpg")).rejects.toThrow(
        "Image fetch failed: 404"
      );
    });

    it("should throw error when network error occurs", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      await expect(fetchImageAsBlob("https://example.com/image.jpg")).rejects.toThrow();
    });
  });

  describe("fetchImageFromAWSAPI Utility", () => {
    it("should construct correct API URL and fetch image", async () => {
      const mockBlob = new Blob(["image data"], { type: "image/jpeg" });
      mockFetch.mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(mockBlob) });
      const result = await fetchImageFromAWSAPI("kiosk1_filter1_123456");
      expect(result).toBe(mockBlob);
      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/kiosk1_filter1_123456");
    });

    it("should use environment variable for base URL", async () => {
      // Can't change env at runtime since API_BASE_URL is cached at module load
      // Verified in the "should construct correct API URL" test
      const mockBlob = new Blob(["data"], { type: "image/jpeg" });
      mockFetch.mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(mockBlob) });
      await fetchImageFromAWSAPI("kiosk1_filter1_123456");
      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/kiosk1_filter1_123456");
    });

    it("should handle fetch errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("API error"));
      await expect(fetchImageFromAWSAPI("kiosk1_filter1_123456")).rejects.toThrow();
    });
  });

  describe("useRemoteImage Hook - Initial State", () => {
    it("should have default initial state", () => {
      (window as { location?: unknown }).location = { search: "" } as Location;
      const { result } = renderHook(() => useRemoteImage());
      expect(result.current.imageId).toBe("");
      expect(result.current.imageBlob).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe("useRemoteImage Hook - Successful Fetch", () => {
    it("should fetch image when valid imageId is in URL", async () => {
      const mockBlob = new Blob(["image"], { type: "image/jpeg" });
      (window as { location?: unknown }).location = {
        search: "?image=kiosk1_filter1_123456",
      } as Location;
      mockFetch.mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(mockBlob) });

      const { result } = renderHook(() => useRemoteImage());
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.imageId).toBe("kiosk1_filter1_123456");
      expect(result.current.imageBlob).toBe(mockBlob);
      expect(result.current.error).toBe(null);
    });

    it("should attempt to resolve a non-imageId ?image= value as a kiosk QR token", async () => {
      (window as { location?: unknown }).location = {
        search: "?image=invalid_id",
      } as Location;
      // Decrypt endpoint returns 404 → hook surfaces error.
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) });

      const { result } = renderHook(() => useRemoteImage());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain("/decrypt-token?token=invalid_id");
      expect(result.current.imageBlob).toBe(null);
      expect(result.current.error).toBe("Invalid photo link");
    });

    it("should fetch the resolved URL when a QR token decrypts successfully", async () => {
      (window as { location?: unknown }).location = {
        search: "?image=encrypted-token-value",
      } as Location;
      const mockBlob = new Blob(["png"], { type: "image/png" });
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ image_url: "https://signed.example.com/img.png" }),
        })
        .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(mockBlob) });

      const { result } = renderHook(() => useRemoteImage());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0][0]).toContain("/decrypt-token?token=encrypted-token-value");
      expect(mockFetch.mock.calls[1][0]).toBe("https://signed.example.com/img.png");
      expect(result.current.imageBlob).toBe(mockBlob);
    });

    it("should set loading state correctly", async () => {
      const mockBlob = new Blob(["data"], { type: "image/jpeg" });
      (window as { location?: unknown }).location = {
        search: "?image=kiosk1_filter1_123456",
      } as Location;

      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(promise as Promise<Response>);

      const { result } = renderHook(() => useRemoteImage());
      expect(result.current.loading).toBe(true);

      resolvePromise!({ ok: true, blob: () => Promise.resolve(mockBlob) });
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("useRemoteImage Hook - Error Handling", () => {
    it("should set error when fetch fails", async () => {
      (window as { location?: unknown }).location = {
        search: "?image=kiosk1_filter1_123456",
      } as Location;
      mockFetch.mockRejectedValueOnce(new Error("Fetch failed"));

      const { result } = renderHook(() => useRemoteImage());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe("Fetch failed");
      expect(result.current.imageBlob).toBe(null);
    });

    it("should set imageBlob to null on error", async () => {
      (window as { location?: unknown }).location = {
        search: "?image=kiosk1_filter1_123456",
      } as Location;
      mockFetch.mockRejectedValueOnce(new Error("Error"));

      const { result } = renderHook(() => useRemoteImage());
      await waitFor(() => {
        expect(result.current.imageBlob).toBe(null);
      });
    });
  });

  describe("useRemoteImage Hook - No ImageId", () => {
    it("should not fetch when no imageId in URL", () => {
      (window as { location?: unknown }).location = { search: "" } as Location;
      renderHook(() => useRemoteImage());
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should remain in initial state when no imageId", () => {
      (window as { location?: unknown }).location = { search: "?other=value" } as Location;
      const { result } = renderHook(() => useRemoteImage());
      expect(result.current.imageId).toBe("");
      expect(result.current.imageBlob).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe("useRemoteImage Hook - Return Value", () => {
    it("should return object with all required properties", () => {
      (window as { location?: unknown }).location = { search: "" } as Location;
      const { result } = renderHook(() => useRemoteImage());
      expect(result.current).toHaveProperty("imageId");
      expect(result.current).toHaveProperty("imageBlob");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
    });
  });

  describe("useRemoteImage Hook - Effect Dependencies", () => {
    it("should only fetch once on mount", async () => {
      const mockBlob = new Blob(["data"], { type: "image/jpeg" });
      (window as { location?: unknown }).location = {
        search: "?image=kiosk1_filter1_123456",
      } as Location;
      mockFetch.mockResolvedValue({ ok: true, blob: () => Promise.resolve(mockBlob) });

      const { rerender } = renderHook(() => useRemoteImage());
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
      rerender();
      rerender();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle blob conversion errors gracefully", async () => {
      (window as { location?: unknown }).location = {
        search: "?image=kiosk1_filter1_123456",
      } as Location;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.reject(new Error("Blob error")),
      });

      const { result } = renderHook(() => useRemoteImage());
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });
});
