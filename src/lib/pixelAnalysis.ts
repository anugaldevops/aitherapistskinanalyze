interface Point {
  x: number;
  y: number;
}

interface PixelData {
  r: number[];
  g: number[];
  b: number[];
  brightness: number[];
}

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function getBoundingBox(polygon: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  const xs = polygon.map(p => p.x);
  const ys = polygon.map(p => p.y);
  return {
    minX: Math.floor(Math.min(...xs)),
    minY: Math.floor(Math.min(...ys)),
    maxX: Math.ceil(Math.max(...xs)),
    maxY: Math.ceil(Math.max(...ys))
  };
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

export function extractPolygonPixels(
  ctx: CanvasRenderingContext2D,
  polygon: Point[],
  imageWidth: number,
  imageHeight: number
): PixelData {
  const bbox = getBoundingBox(polygon);

  const clampedMinX = Math.max(0, bbox.minX);
  const clampedMinY = Math.max(0, bbox.minY);
  const clampedMaxX = Math.min(imageWidth, bbox.maxX);
  const clampedMaxY = Math.min(imageHeight, bbox.maxY);

  const width = clampedMaxX - clampedMinX;
  const height = clampedMaxY - clampedMinY;

  if (width <= 0 || height <= 0) {
    return { r: [], g: [], b: [], brightness: [] };
  }

  const imageData = ctx.getImageData(clampedMinX, clampedMinY, width, height);
  const data = imageData.data;

  const pixelData: PixelData = { r: [], g: [], b: [], brightness: [] };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const absoluteX = clampedMinX + x;
      const absoluteY = clampedMinY + y;

      if (isPointInPolygon({ x: absoluteX, y: absoluteY }, polygon)) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        pixelData.r.push(r);
        pixelData.g.push(g);
        pixelData.b.push(b);
        pixelData.brightness.push((r + g + b) / 3);
      }
    }
  }

  return pixelData;
}

export function calculateTextureVariance(pixelData: PixelData): number {
  return calculateStandardDeviation(pixelData.brightness);
}

export function calculatePigmentationVariance(pixelData: PixelData): number {
  const rVariance = calculateStandardDeviation(pixelData.r);
  const gVariance = calculateStandardDeviation(pixelData.g);
  const bVariance = calculateStandardDeviation(pixelData.b);
  return (rVariance + gVariance + bVariance) / 3;
}

export function calculateAverageBrightness(pixelData: PixelData): number {
  if (pixelData.brightness.length === 0) return 0;
  return pixelData.brightness.reduce((sum, val) => sum + val, 0) / pixelData.brightness.length;
}

export function scoreTextureVariance(variance: number): number {
  if (variance < 15) return 0;
  if (variance < 25) return 1;
  if (variance < 40) return 2;
  return 3;
}

export function scorePigmentationEvenness(variance: number): number {
  return variance < 20 ? 0 : 3;
}

export function scoreBrightness(brightness: number): number {
  if (brightness > 140) return 0;
  if (brightness >= 120) return 1;
  if (brightness >= 100) return 2;
  return 3;
}
