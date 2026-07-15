export interface ParsedImageId {
  kioskName: string;
  filterName: string;
  timestamp: string;
}

export function parseImageId(imageId: string | null): ParsedImageId {
  if (!imageId) {
    return { kioskName: "", filterName: "", timestamp: "" };
  }
  const parts = imageId.split("_");
  return {
    kioskName: parts[0] ?? "",
    filterName: parts[1] ?? "",
    timestamp: parts[2] ?? "",
  };
}

export function isValidImageId(imageId: string | null): imageId is string {
  if (!imageId) return false;
  return /^[a-zA-Z0-9]+_[a-zA-Z0-9]+_\d+$/.test(imageId);
}