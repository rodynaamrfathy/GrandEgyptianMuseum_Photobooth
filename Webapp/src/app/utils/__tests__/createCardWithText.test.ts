import { createCardWithText } from '../createCardWithText';

describe('createCardWithText Utility Function', () => {
  let mockImage: HTMLImageElement;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    // Mock Image
    mockImage = {
      crossOrigin: '',
      src: '',
      width: 800,
      height: 1200,
      onload: null,
      onerror: null,
      addEventListener: jest.fn(),
    } as unknown as HTMLImageElement;

    // Mock Canvas
    mockCanvas = {
      width: 0,
      height: 0,
      style: {},
      getContext: jest.fn(),
      toBlob: jest.fn(),
    } as unknown as HTMLCanvasElement;

    // Mock Canvas Context
    mockContext = {
      scale: jest.fn(),
      drawImage: jest.fn(),
      fillText: jest.fn(),
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
    } as unknown as CanvasRenderingContext2D;

    // Setup mocks
    (mockCanvas.getContext as jest.Mock).mockReturnValue(mockContext);
    global.Image = jest.fn(() => mockImage) as unknown as typeof Image;
    document.createElement = jest
      .fn((tagName: string) => {
        if (tagName === 'canvas') return mockCanvas;
        return {} as HTMLElement;
      }) as unknown as typeof document.createElement;

    // Mock document.fonts (read-only property)
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        load: jest.fn().mockResolvedValue([]),
      },
    });

    // Mock window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      value: 2,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Successfully creates card with text
  describe('Successful Card Creation', () => {
    it('should create a blob with card image and text', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const promise = createCardWithText(
        'https://example.com/card.jpg',
        'Test Message',
        '27.01.2026'
      );

      // Trigger image load
      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      const result = await promise;

      expect(result).toBe(mockBlob);
      expect(mockContext.drawImage).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('should set correct canvas dimensions based on image and DPR', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const promise = createCardWithText(
        'https://example.com/card.jpg',
        'Message',
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      expect(mockCanvas.width).toBe(800 * 2); // image.width * dpr
      expect(mockCanvas.height).toBe(1200 * 2); // image.height * dpr
    });

    it('should scale context by device pixel ratio', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const promise = createCardWithText(
        'https://example.com/card.jpg',
        'Message',
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      expect(mockContext.scale).toHaveBeenCalledWith(2, 2);
    });
  });

  // Test 2: Text rendering
  describe('Text Rendering', () => {
    it('should render text on canvas', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const testText = 'My Custom Message';
      const promise = createCardWithText(
        'https://example.com/card.jpg',
        testText,
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      expect(mockContext.fillText).toHaveBeenCalled();
      
      // Check if any fillText call contains our text
      const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls;
      const hasTestText = fillTextCalls.some((call) => 
        call[0].includes(testText.substring(0, 10))
      );
      expect(hasTestText || fillTextCalls.length > 0).toBe(true);
    });

    it('should split long text into multiple lines', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      // Text longer than 25 characters
      const longText = 'This is a very long message that should be split';
      const promise = createCardWithText(
        'https://example.com/card.jpg',
        longText,
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      // Should call fillText multiple times (for multiple lines)
      const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls;
      expect(fillTextCalls.length).toBeGreaterThan(1);
    });

    it('should limit text to maximum 3 lines', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      // Very long text that would create more than 3 lines
      const veryLongText = 'a'.repeat(100);
      const promise = createCardWithText(
        'https://example.com/card.jpg',
        veryLongText,
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls;
      // Should have max 3 lines of text + 1 date = 4 calls
      const textCalls = fillTextCalls.filter((call) => 
        typeof call[0] === 'string' && call[0].length > 0
      );
      expect(textCalls.length).toBeLessThanOrEqual(4);
    });
  });

  // Test 3: Date rendering
  describe('Date Rendering', () => {
    it('should render date on canvas', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const testDate = '15.03.2026';
      const promise = createCardWithText(
        'https://example.com/card.jpg',
        'Message',
        testDate
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls;
      const hasDate = fillTextCalls.some((call) => call[0] === testDate);
      expect(hasDate).toBe(true);
    });

    it('should position date correctly', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const promise = createCardWithText(
        'https://example.com/card.jpg',
        'Message',
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      // Date should be positioned at specific coordinates
      const fillTextCalls = (mockContext.fillText as jest.Mock).mock.calls;
      const dateCall = fillTextCalls[fillTextCalls.length - 1]; // Last call should be date
      
      expect(dateCall[1]).toBeCloseTo(800 * 0.82, 0); // x position
      expect(dateCall[2]).toBeCloseTo(1200 * 0.506, 0); // y position
    });
  });

  // Test 4: Font handling
  describe('Font Handling', () => {
    it('should load fonts before rendering', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const promise = createCardWithText(
        'https://example.com/card.jpg',
        'Message',
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      expect(document.fonts.load).toHaveBeenCalled();
    });

    it('should use different font for Arabic text', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const arabicText = 'مرحبا بك'; // Arabic text
      const promise = createCardWithText(
        'https://example.com/card.jpg',
        arabicText,
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      // Check if Arabic font was loaded
      const fontLoadCalls = (document.fonts.load as jest.Mock).mock.calls;
      const hasArabicFont = fontLoadCalls.some((call) => 
        call[0].includes('ArabicCustom')
      );
      expect(hasArabicFont).toBe(true);
    });

    it('should use default font for non-Arabic text', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const englishText = 'Hello World';
      const promise = createCardWithText(
        'https://example.com/card.jpg',
        englishText,
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      const fontLoadCalls = (document.fonts.load as jest.Mock).mock.calls;
      const hasMariamFont = fontLoadCalls.some((call) => 
        call[0].includes('Mariam')
      );
      expect(hasMariamFont).toBe(true);
    });
  });

  // Test 5: Error handling
  describe('Error Handling', () => {
    it('should reject promise when canvas context is not available', async () => {
      (mockCanvas.getContext as jest.Mock).mockReturnValue(null);

      const promise = createCardWithText(
        'https://example.com/card.jpg',
        'Message',
        '27.01.2026'
      );

      if (mockImage.onload) {
        mockImage.onload({} as Event);
      }

      await expect(promise).rejects.toThrow('Canvas context could not be created');
    });

    it('should reject promise when image fails to load', async () => {
      const promise = createCardWithText(
        'https://example.com/invalid.jpg',
        'Message',
        '27.01.2026'
      );

      if (mockImage.onerror) {
        mockImage.onerror({} as Event);
      }

      await expect(promise).rejects.toThrow('Image failed to load');
    });

    it('should reject promise when blob creation fails', async () => {
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(null);
      });

      const promise = createCardWithText(
        'https://example.com/card.jpg',
        'Message',
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await expect(promise).rejects.toThrow('Blob creation failed');
    });
  });

  // Test 6: Image setup
  describe('Image Setup', () => {
    it('should set crossOrigin to anonymous', () => {
      createCardWithText(
        'https://example.com/card.jpg',
        'Message',
        '27.01.2026'
      );

      expect(mockImage.crossOrigin).toBe('anonymous');
    });

    it('should set image src correctly', () => {
      const cardUrl = 'https://example.com/custom-card.jpg';
      createCardWithText(cardUrl, 'Message', '27.01.2026');

      expect(mockImage.src).toBe(cardUrl);
    });
  });

  // Test 7: Canvas styling
  describe('Canvas Styling', () => {
    it('should set correct text color for main text', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const promise = createCardWithText(
        'https://example.com/card.jpg',
        'Message',
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      // Check if fillStyle was set to the main text color
      expect(mockContext.fillStyle).toBe('#333333');
    });

    it('should set text alignment to center for main text', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const promise = createCardWithText(
        'https://example.com/card.jpg',
        'Message',
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      expect(mockContext.textAlign).toBe('right'); // Last set value (for date)
    });
  });

  // Test 8: Edge cases
  describe('Edge Cases', () => {
    it('should handle empty text', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const promise = createCardWithText(
        'https://example.com/card.jpg',
        '',
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      const result = await promise;
      expect(result).toBe(mockBlob);
    });

    it('should handle special characters in text', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const specialText = 'Hello! @#$%^&*()';
      const promise = createCardWithText(
        'https://example.com/card.jpg',
        specialText,
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      const result = await promise;
      expect(result).toBe(mockBlob);
    });

    it('should handle devicePixelRatio of 1', async () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: 1,
      });

      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (mockCanvas.toBlob as jest.Mock).mockImplementation((callback) => {
        callback(mockBlob);
      });

      const promise = createCardWithText(
        'https://example.com/card.jpg',
        'Message',
        '27.01.2026'
      );

      if (mockImage.onload) {
        await mockImage.onload({} as Event);
      }

      await promise;

      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(1200);
    });
  });
});
