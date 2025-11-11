import { ZoneAdjustment } from './zoneAdjustments';

export function applyRectAdjustment(
  left: number,
  top: number,
  width: number,
  height: number,
  adj: ZoneAdjustment,
  faceWidth: number,
  faceHeight: number
) {
  const adjustedWidth = width * adj.scaleWidth;
  const adjustedHeight = height * adj.scaleHeight;
  const adjustedLeft = left + (faceWidth * adj.offsetX);
  const adjustedTop = top + (faceHeight * adj.offsetY);

  return {
    left: adjustedLeft,
    top: adjustedTop,
    width: adjustedWidth,
    height: adjustedHeight,
  };
}

export function applyCenterAdjustment(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  adj: ZoneAdjustment,
  faceWidth: number,
  faceHeight: number
) {
  const adjustedWidth = width * adj.scaleWidth;
  const adjustedHeight = height * adj.scaleHeight;
  const adjustedCenterX = centerX + (faceWidth * adj.offsetX);
  const adjustedCenterY = centerY + (faceHeight * adj.offsetY);

  return {
    centerX: adjustedCenterX,
    centerY: adjustedCenterY,
    width: adjustedWidth,
    height: adjustedHeight,
  };
}
