import { createCardWithText } from "../createCardWithText";

describe("createCardWithText Utility Function", () => {
  let mockImage: HTMLImageElement;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    mockImage = {
      crossOrigin: "",
      src: "",
      width: 800,
      height: 1200,
      onload: null,
      onerror: null,
      addEventListener: jest.fn(),
    } as unknown as HTMLImageElement;

    mockCanvas = {
      width: 0,
      height: 0,
      style: {},
      getContext: jest.fn(),
      toBlob: jest.fn(),
    } as unknown as HTMLCanvasElement;

    mockContext = {
      scale: jest.fn(),
      drawImage: jest.fn(),
      fillText: jest.fn(),
      fillStyle: "",
      font: "",
      textAlign: "",
      textBaseline: "",
      measureText: jest.fn((text: string) => ({
        width: text.length * 10,
      })),
    } as unknown as CanvasRenderingContext2D;

    (mockCanvas.getContext as jest.Mock).mockReturnValue(mockContext);
    global.Image = jest.fn(() => mockImage) as unknown as typeof Image;
    document.createElement = jest.fn((tagName: string) => {
      if (tagName === "canvas") return mockCanvas;
      return {} as HTMLElement;
    }) as unknown as typeof document.createElement;

    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: {
        load: jest.fn().mockResolvedValue([]),
      },
    });

    Object.defineProperty(window, "devicePixelRatio", {
      writable: true,
      value: 2,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper to trigger image load
  const triggerLoad = async (): Promise<void> => {
    if (mockImage.onload) {
      await mockImage.onload({} as Event);
    }
  };

  // Test 1: Successfully creates card with text
  describe("Successful Card Creation", () => {
    it("should create a blob with card image and text", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText(
        "https://example.com/card.jpg",
        "Test Message",
        "27.01.2026"
      );
      await triggerLoad();
      const result = await promise;

      expect(result).toBe(mockBlob);
      expect(mockContext.drawImage).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it("should set correct canvas dimensions based on image and DPR", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "Message", "27.01.2026");
      await triggerLoad();
      await promise;

      expect(mockCanvas.width).toBe(800 * 2);
      expect(mockCanvas.height).toBe(1200 * 2);
    });

    it("should scale context by device pixel ratio", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "Message", "27.01.2026");
      await triggerLoad();
      await promise;

      expect(mockContext.scale).toHaveBeenCalledWith(2, 2);
    });
  });

  // Test 2: Text rendering
  describe("Text Rendering", () => {
    it("should render text on canvas", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText(
        "https://example.com/card.jpg",
        "My Custom Message",
        "27.01.2026"
      );
      await triggerLoad();
      await promise;

      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it("should wrap long text using measureText", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      // measureText returns width = text.length * 10
      // maxWidth = 800 * 0.72 = 576
      // So ~57 chars per line
      const longText =
        "This is a very long message that should be wrapped into multiple lines by measureText";
      const promise = createCardWithText("https://example.com/card.jpg", longText, "27.01.2026");
      await triggerLoad();
      await promise;

      const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls;
      // Should have multiple line calls + 1 date call
      expect(fillTextCalls.length).toBeGreaterThan(1);
    });

    it("should limit text to maximum 3 lines", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const veryLongText = "a".repeat(200);
      const promise = createCardWithText(
        "https://example.com/card.jpg",
        veryLongText,
        "27.01.2026"
      );
      await triggerLoad();
      await promise;

      const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls;
      // Max 3 text lines + 1 date = max 4 calls
      expect(fillTextCalls.length).toBeLessThanOrEqual(4);
    });
  });

  // Test 3: Date rendering
  describe("Date Rendering", () => {
    it("should render date on canvas", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const testDate = "15.03.2026";
      const promise = createCardWithText("https://example.com/card.jpg", "Message", testDate);
      await triggerLoad();
      await promise;

      const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls;
      const hasDate = fillTextCalls.some((call: unknown[]) => call[0] === testDate);
      expect(hasDate).toBe(true);
    });

    it("should position date correctly", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "Message", "27.01.2026");
      await triggerLoad();
      await promise;

      const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls;
      const dateCall = fillTextCalls[fillTextCalls.length - 1];
      expect(dateCall[1]).toBeCloseTo(800 * 0.82, 0);
      expect(dateCall[2]).toBeCloseTo(1200 * 0.506, 0);
    });
  });

  // Test 4: Font handling
  describe("Font Handling", () => {
    it("should load fonts before rendering", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "Message", "27.01.2026");
      await triggerLoad();
      await promise;

      expect(document.fonts.load).toHaveBeenCalled();
    });

    it("should use Greta Arabic font for Arabic text", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "مرحبا بك", "27.01.2026");
      await triggerLoad();
      await promise;

      const fontLoadCalls = (document.fonts.load as jest.Mock).mock.calls;
      const hasArabicFont = fontLoadCalls.some((call: unknown[]) =>
        String(call[0]).includes("Greta Arabic")
      );
      expect(hasArabicFont).toBe(true);
    });

    it("should use Mariam font for non-Arabic text", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText(
        "https://example.com/card.jpg",
        "Hello World",
        "27.01.2026"
      );
      await triggerLoad();
      await promise;

      const fontLoadCalls = (document.fonts.load as jest.Mock).mock.calls;
      const hasMariamFont = fontLoadCalls.some((call: unknown[]) =>
        String(call[0]).includes("Mariam")
      );
      expect(hasMariamFont).toBe(true);
    });

    it("should use normal weight for Arabic text", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "مرحبا", "27.01.2026");
      await triggerLoad();
      await promise;

      const fontLoadCalls = (document.fonts.load as jest.Mock).mock.calls;
      const arabicCall = fontLoadCalls.find((call: unknown[]) =>
        String(call[0]).includes("Greta Arabic")
      );
      expect(String(arabicCall?.[0])).toContain("normal");
    });

    it("should use bold weight for English text", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "Hello", "27.01.2026");
      await triggerLoad();
      await promise;

      const fontLoadCalls = (document.fonts.load as jest.Mock).mock.calls;
      const mariamCall = fontLoadCalls.find((call: unknown[]) =>
        String(call[0]).includes("Mariam")
      );
      expect(String(mariamCall?.[0])).toContain("bold");
    });
  });

  // Test 5: Error handling
  describe("Error Handling", () => {
    it("should reject promise when canvas context is not available", async () => {
      (mockCanvas.getContext as jest.Mock).mockReturnValue(null);

      const promise = createCardWithText("https://example.com/card.jpg", "Message", "27.01.2026");
      await triggerLoad();

      await expect(promise).rejects.toThrow("Canvas context could not be created");
    });

    it("should reject promise when image fails to load", async () => {
      const promise = createCardWithText(
        "https://example.com/invalid.jpg",
        "Message",
        "27.01.2026"
      );

      if (mockImage.onerror) {
        mockImage.onerror({} as Event);
      }

      await expect(promise).rejects.toThrow("Image failed to load");
    });

    it("should reject promise when blob creation fails", async () => {
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(null);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "Message", "27.01.2026");
      await triggerLoad();

      await expect(promise).rejects.toThrow("Blob creation failed");
    });
  });

  // Test 6: Image setup
  describe("Image Setup", () => {
    it("should set crossOrigin to anonymous", () => {
      createCardWithText("https://example.com/card.jpg", "Message", "27.01.2026");
      expect(mockImage.crossOrigin).toBe("anonymous");
    });

    it("should set image src correctly", () => {
      const cardUrl = "https://example.com/custom-card.jpg";
      createCardWithText(cardUrl, "Message", "27.01.2026");
      expect(mockImage.src).toBe(cardUrl);
    });
  });

  // Test 7: Canvas styling
  describe("Canvas Styling", () => {
    it("should set correct text color for main text", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "Message", "27.01.2026");
      await triggerLoad();
      await promise;

      expect(mockContext.fillStyle).toBe("#393939");
    });

    it("should set text alignment correctly", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "Message", "27.01.2026");
      await triggerLoad();
      await promise;

      expect(mockContext.textAlign).toBe("right");
    });
  });

  // Test 8: Edge cases
  describe("Edge Cases", () => {
    it("should handle empty text", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "", "27.01.2026");
      await triggerLoad();
      const result = await promise;
      expect(result).toBe(mockBlob);
    });

    it("should handle special characters in text", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText(
        "https://example.com/card.jpg",
        "Hello! @#$%^&*()",
        "27.01.2026"
      );
      await triggerLoad();
      const result = await promise;
      expect(result).toBe(mockBlob);
    });

    it("should handle devicePixelRatio of 1", async () => {
      Object.defineProperty(window, "devicePixelRatio", { writable: true, value: 1 });

      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "Message", "27.01.2026");
      await triggerLoad();
      await promise;

      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(1200);
    });
  });

  // Test 9: Text slot positioning
  describe("Text Slot Positioning", () => {
    it("should center single line text on middle slot", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "Short", "27.01.2026");
      await triggerLoad();
      await promise;

      const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls;
      const textCalls = fillTextCalls.filter((c: unknown[]) => c[0] !== "27.01.2026");
      // Single line should be at centerY (1200 * 0.41 = 492)
      expect(textCalls.length).toBe(1);
      expect(textCalls[0][2]).toBeCloseTo(1200 * 0.41, 0);
    });

    it("should place Arabic text at adjusted Y position", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((cb: (b: Blob | null) => void) => {
        cb(mockBlob);
      });

      const promise = createCardWithText("https://example.com/card.jpg", "مرحبا", "27.01.2026");
      await triggerLoad();
      await promise;

      const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls;
      const textCalls = fillTextCalls.filter((c: unknown[]) => c[0] !== "27.01.2026");
      // Arabic centerY = 1200 * 0.406 = 487.2
      expect(textCalls[0][2]).toBeCloseTo(1200 * 0.406, 0);
    });
  });
});
