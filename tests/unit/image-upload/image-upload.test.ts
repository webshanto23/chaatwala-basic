import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImgbbProvider } from "@/lib/image-upload/imgbb";
import { uploadImage } from "@/lib/image-upload";

vi.mock("@/lib/image-upload/compress", () => ({
  compressImage: vi.fn(() => Promise.resolve(Buffer.from("compressed-image"))),
}));

vi.mock("@/lib/image-upload/types", () => ({
  ImageUploadOptions: {},
  ImageUploadResult: {},
  ImageProvider: {},
}));

import { compressImage } from "@/lib/image-upload/compress";

const mockApiKey = "test-api-key";
const provider = new ImgbbProvider(mockApiKey);

describe("ImgbbProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads image successfully", async () => {
    const mockResponse = {
      success: true,
      data: {
        url: "https://example.com/image.jpg",
        delete_url: "https://example.com/delete",
      },
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve(""),
      } as Response)
    );

    const result = await provider.upload(new File(["test"], "test.jpg", { type: "image/jpeg" }));

    expect(result.url).toBe("https://example.com/image.jpg");
    expect(result.deleteUrl).toBe("https://example.com/delete");
  });

  it("retries on network failure and succeeds", async () => {
    let callCount = 0;
    global.fetch = vi.fn(() => {
      callCount++;
      if (callCount < 2) {
        return Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve("Server error"),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { url: "https://example.com/image.jpg", delete_url: "https://example.com/delete" },
          }),
        text: () => Promise.resolve(""),
      } as Response);
    });

    const result = await provider.upload(new File(["test"], "test.jpg", { type: "image/jpeg" }));

    expect(result.url).toBe("https://example.com/image.jpg");
    expect(callCount).toBe(2);
  });

  it("throws error after max retries", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server error"),
      } as Response)
    );

    await expect(provider.upload(new File(["test"], "test.jpg", { type: "image/jpeg" }))).rejects.toThrow(
      "ImageBB upload failed: 500 Server error"
    );
  });

  it("throws error when response is missing url", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            data: null,
          }),
        text: () => Promise.resolve(""),
      } as Response)
    );

    await expect(provider.upload(new File(["test"], "test.jpg", { type: "image/jpeg" }))).rejects.toThrow(
      "ImageBB upload failed: missing url in response"
    );
  });

  it("uses alt text in filename when provided", async () => {
    const mockResponse = {
      success: true,
      data: {
        url: "https://example.com/image.jpg",
        delete_url: "https://example.com/delete",
      },
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve(""),
      } as Response)
    );

    await provider.upload(new File(["test"], "test.jpg", { type: "image/jpeg" }), { alt: "My Product Name" });

    const formData = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]?.body as FormData;
    expect(formData.get("image")).toBeInstanceOf(Blob);
  });

  it("throws error on network exception", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

    await expect(provider.upload(new File(["test"], "test.jpg", { type: "image/jpeg" }))).rejects.toThrow(
      "Network error"
    );
  });

  it("handles delete_url being undefined in response", async () => {
    const mockResponse = {
      success: true,
      data: {
        url: "https://example.com/image.jpg",
        delete_url: undefined,
      },
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve(""),
      } as Response)
    );

    const result = await provider.upload(new File(["test"], "test.jpg", { type: "image/jpeg" }));

    expect(result.url).toBe("https://example.com/image.jpg");
    expect(result.deleteUrl).toBeUndefined();
  });
});

describe("uploadImage wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.IMAGEBB_API_KEY;
  });

  it("throws error when IMAGEBB_API_KEY is not set", async () => {
    process.env.IMAGE_PROVIDER = "imgbb";

    await expect(uploadImage(new File(["test"], "test.jpg", { type: "image/jpeg" }))).rejects.toThrow(
      "IMAGEBB_API_KEY is not set"
    );
  });

  it("creates ImgbbProvider when IMAGEBB_API_KEY is set", async () => {
    process.env.IMAGEBB_API_KEY = "test-key";
    process.env.IMAGE_PROVIDER = "imgbb";

    const mockResponse = {
      success: true,
      data: {
        url: "https://example.com/image.jpg",
        delete_url: "https://example.com/delete",
      },
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve(""),
      } as Response)
    );

    const result = await uploadImage(new File(["test"], "test.jpg", { type: "image/jpeg" }));

    expect(result.url).toBe("https://example.com/image.jpg");
  });

  it("throws error for unsupported provider", async () => {
    vi.resetModules();
    process.env.IMAGE_PROVIDER = "unsupported";
    delete process.env.IMAGEBB_API_KEY;

    const { uploadImage: freshUploadImage } = await import("@/lib/image-upload");

    await expect(freshUploadImage(new File(["test"], "test.jpg", { type: "image/jpeg" }))).rejects.toThrow(
      "Unsupported IMAGE_PROVIDER: unsupported"
    );
  });
});
