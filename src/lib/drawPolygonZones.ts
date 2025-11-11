import { segmentFacialZones, segmentationToYAML } from './zoneSegmentation';

const ZONE_COLORS: Record<string, string> = {
  'forehead': '#FF6B6B',
  'glabella': '#4ECDC4',
  'eye_crowsfeet_left': '#45B7D1',
  'eye_crowsfeet_right': '#96CEB4',
  'upper_cheek_left': '#FFEAA7',
  'upper_cheek_right': '#DFE6E9',
  'lower_cheek_left': '#74B9FF',
  'lower_cheek_right': '#A29BFE',
  'nasolabial_left': '#FD79A8',
  'nasolabial_right': '#FDCB6E'
};

export function drawPolygonZones(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  imageWidth: number,
  imageHeight: number
): { yaml: string; result: any } {
  console.log('=== DRAWING POLYGON-BASED ZONES ===');

  const result = segmentFacialZones(landmarks, imageWidth, imageHeight);

  if (result.status === 'QUALITY_REJECTED') {
    console.error('Quality check failed:', result.reason);
    return { yaml: segmentationToYAML(result), result };
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  for (const zone of result.zones) {
    const color = ZONE_COLORS[zone.name] || '#CCCCCC';
    const rgb = hexToRgb(color);

    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;

    ctx.beginPath();
    if (zone.polygon.length > 0) {
      ctx.moveTo(zone.polygon[0].x, zone.polygon[0].y);
      for (let i = 1; i < zone.polygon.length; i++) {
        ctx.lineTo(zone.polygon[i].x, zone.polygon[i].y);
      }
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    console.log(`Drew ${zone.name} with ${zone.polygon.length} vertices, confidence: ${zone.confidence}`);
  }

  console.log('=== ALL POLYGON ZONES DRAWN SUCCESSFULLY ===');

  return { yaml: segmentationToYAML(result), result };
}
