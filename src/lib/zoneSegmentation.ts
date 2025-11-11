interface Point {
  x: number;
  y: number;
}

interface Polygon {
  name: string;
  polygon: Point[];
  confidence: number;
}

interface SegmentationResult {
  zones: Polygon[];
  image_size: [number, number];
  status: 'OK' | 'QUALITY_REJECTED';
  reason?: string;
}

export function validateFaceQuality(landmarks: any[], imageWidth: number, imageHeight: number): { valid: boolean; reason?: string } {
  if (!landmarks || landmarks.length < 468) {
    return { valid: false, reason: 'Insufficient landmarks detected' };
  }

  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  const eyeDistance = Math.sqrt(
    Math.pow((rightEye.x - leftEye.x) * imageWidth, 2) +
    Math.pow((rightEye.y - leftEye.y) * imageHeight, 2)
  );

  const verticalTilt = Math.abs(leftEye.y - rightEye.y) * imageHeight;
  const tiltAngle = Math.atan2(verticalTilt, eyeDistance) * (180 / Math.PI);

  if (tiltAngle > 20) {
    return { valid: false, reason: 'Face tilt exceeds ±20°' };
  }

  const faceWidth = eyeDistance;
  if (faceWidth < imageWidth * 0.15) {
    return { valid: false, reason: 'Face too small in frame' };
  }

  return { valid: true };
}

function createClockwisePolygon(points: Point[]): Point[] {
  const centroid = points.reduce(
    (acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length }),
    { x: 0, y: 0 }
  );

  const sorted = [...points].sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
    return angleA - angleB;
  });

  return sorted;
}

function toIntCoords(point: { x: number; y: number }, width: number, height: number): Point {
  return {
    x: Math.round(point.x * width),
    y: Math.round(point.y * height)
  };
}

export function segmentFacialZones(landmarks: any[], imageWidth: number, imageHeight: number): SegmentationResult {
  const qualityCheck = validateFaceQuality(landmarks, imageWidth, imageHeight);
  if (!qualityCheck.valid) {
    return {
      zones: [],
      image_size: [imageWidth, imageHeight],
      status: 'QUALITY_REJECTED',
      reason: qualityCheck.reason
    };
  }

  const getLandmark = (idx: number) => landmarks[idx];

  const leftEyeOuter = getLandmark(33);
  const rightEyeOuter = getLandmark(263);
  const leftEyeInner = getLandmark(133);
  const rightEyeInner = getLandmark(362);
  const leftEyeTop = getLandmark(159);
  const rightEyeTop = getLandmark(386);
  const noseTip = getLandmark(1);
  const leftNose = getLandmark(48);
  const rightNose = getLandmark(278);
  const leftMouth = getLandmark(61);
  const rightMouth = getLandmark(291);

  const allYCoords = landmarks.map((l: any) => l.y * imageHeight);
  const allXCoords = landmarks.map((l: any) => l.x * imageWidth);
  const faceTop = Math.min(...allYCoords);
  const faceBottom = Math.max(...allYCoords);
  const faceLeft = Math.min(...allXCoords);
  const faceRight = Math.max(...allXCoords);
  const faceWidth = faceRight - faceLeft;
  const faceHeight = faceBottom - faceTop;

  const eyeLineY = (leftEyeTop.y + rightEyeTop.y) / 2;
  const foreheadTop = faceTop / imageHeight;
  const foreheadBottom = eyeLineY - (faceHeight / imageHeight) * 0.02;

  const zones: Polygon[] = [];

  zones.push({
    name: 'forehead',
    polygon: createClockwisePolygon([
      toIntCoords({ x: faceLeft / imageWidth, y: foreheadTop }, imageWidth, imageHeight),
      toIntCoords({ x: faceRight / imageWidth, y: foreheadTop }, imageWidth, imageHeight),
      toIntCoords({ x: faceRight / imageWidth, y: foreheadBottom }, imageWidth, imageHeight),
      toIntCoords({ x: faceLeft / imageWidth, y: foreheadBottom }, imageWidth, imageHeight)
    ]),
    confidence: 0.95
  });

  const glabellaCenterX = (leftEyeInner.x + rightEyeInner.x) / 2;
  const glabellaCenterY = eyeLineY - (faceHeight / imageHeight) * 0.015;
  const glabellaWidth = (faceWidth / imageWidth) * 0.08;
  const glabellaHeight = (faceHeight / imageHeight) * 0.04;

  zones.push({
    name: 'glabella',
    polygon: createClockwisePolygon([
      toIntCoords({ x: glabellaCenterX - glabellaWidth / 2, y: glabellaCenterY - glabellaHeight / 2 }, imageWidth, imageHeight),
      toIntCoords({ x: glabellaCenterX + glabellaWidth / 2, y: glabellaCenterY - glabellaHeight / 2 }, imageWidth, imageHeight),
      toIntCoords({ x: glabellaCenterX + glabellaWidth / 2, y: glabellaCenterY + glabellaHeight / 2 }, imageWidth, imageHeight),
      toIntCoords({ x: glabellaCenterX - glabellaWidth / 2, y: glabellaCenterY + glabellaHeight / 2 }, imageWidth, imageHeight)
    ]),
    confidence: 0.92
  });

  const crowsLeftWidth = (faceWidth / imageWidth) * 0.08;
  const crowsLeftHeight = (faceHeight / imageHeight) * 0.06;
  zones.push({
    name: 'eye_crowsfeet_left',
    polygon: createClockwisePolygon([
      toIntCoords({ x: leftEyeOuter.x - crowsLeftWidth * 1.2, y: leftEyeOuter.y - crowsLeftHeight / 2 }, imageWidth, imageHeight),
      toIntCoords({ x: leftEyeOuter.x - crowsLeftWidth * 0.2, y: leftEyeOuter.y - crowsLeftHeight / 2 }, imageWidth, imageHeight),
      toIntCoords({ x: leftEyeOuter.x - crowsLeftWidth * 0.2, y: leftEyeOuter.y + crowsLeftHeight / 2 }, imageWidth, imageHeight),
      toIntCoords({ x: leftEyeOuter.x - crowsLeftWidth * 1.2, y: leftEyeOuter.y + crowsLeftHeight / 2 }, imageWidth, imageHeight)
    ]),
    confidence: 0.88
  });

  const crowsRightWidth = (faceWidth / imageWidth) * 0.08;
  const crowsRightHeight = (faceHeight / imageHeight) * 0.06;
  zones.push({
    name: 'eye_crowsfeet_right',
    polygon: createClockwisePolygon([
      toIntCoords({ x: rightEyeOuter.x + crowsRightWidth * 0.2, y: rightEyeOuter.y - crowsRightHeight / 2 }, imageWidth, imageHeight),
      toIntCoords({ x: rightEyeOuter.x + crowsRightWidth * 1.2, y: rightEyeOuter.y - crowsRightHeight / 2 }, imageWidth, imageHeight),
      toIntCoords({ x: rightEyeOuter.x + crowsRightWidth * 1.2, y: rightEyeOuter.y + crowsRightHeight / 2 }, imageWidth, imageHeight),
      toIntCoords({ x: rightEyeOuter.x + crowsRightWidth * 0.2, y: rightEyeOuter.y + crowsRightHeight / 2 }, imageWidth, imageHeight)
    ]),
    confidence: 0.88
  });

  zones.push({
    name: 'upper_cheek_left',
    polygon: createClockwisePolygon([
      toIntCoords({ x: leftEyeOuter.x - (faceWidth / imageWidth) * 0.08, y: leftEyeOuter.y + (faceHeight / imageHeight) * 0.02 }, imageWidth, imageHeight),
      toIntCoords({ x: leftEyeInner.x + (faceWidth / imageWidth) * 0.02, y: leftEyeOuter.y + (faceHeight / imageHeight) * 0.02 }, imageWidth, imageHeight),
      toIntCoords({ x: leftEyeInner.x + (faceWidth / imageWidth) * 0.02, y: noseTip.y }, imageWidth, imageHeight),
      toIntCoords({ x: leftEyeOuter.x - (faceWidth / imageWidth) * 0.08, y: noseTip.y }, imageWidth, imageHeight)
    ]),
    confidence: 0.90
  });

  zones.push({
    name: 'upper_cheek_right',
    polygon: createClockwisePolygon([
      toIntCoords({ x: rightEyeInner.x - (faceWidth / imageWidth) * 0.02, y: rightEyeOuter.y + (faceHeight / imageHeight) * 0.02 }, imageWidth, imageHeight),
      toIntCoords({ x: rightEyeOuter.x + (faceWidth / imageWidth) * 0.08, y: rightEyeOuter.y + (faceHeight / imageHeight) * 0.02 }, imageWidth, imageHeight),
      toIntCoords({ x: rightEyeOuter.x + (faceWidth / imageWidth) * 0.08, y: noseTip.y }, imageWidth, imageHeight),
      toIntCoords({ x: rightEyeInner.x - (faceWidth / imageWidth) * 0.02, y: noseTip.y }, imageWidth, imageHeight)
    ]),
    confidence: 0.90
  });

  const nasoWidth = (faceWidth / imageWidth) * 0.025;
  const leftNasoPoints = [
    toIntCoords({ x: leftNose.x - nasoWidth, y: leftNose.y }, imageWidth, imageHeight),
    toIntCoords({ x: leftNose.x + nasoWidth, y: leftNose.y }, imageWidth, imageHeight),
    toIntCoords({ x: leftMouth.x + nasoWidth, y: leftMouth.y }, imageWidth, imageHeight),
    toIntCoords({ x: leftMouth.x - nasoWidth, y: leftMouth.y }, imageWidth, imageHeight)
  ];
  zones.push({
    name: 'nasolabial_left',
    polygon: createClockwisePolygon(leftNasoPoints),
    confidence: 0.85
  });

  const rightNasoPoints = [
    toIntCoords({ x: rightNose.x - nasoWidth, y: rightNose.y }, imageWidth, imageHeight),
    toIntCoords({ x: rightNose.x + nasoWidth, y: rightNose.y }, imageWidth, imageHeight),
    toIntCoords({ x: rightMouth.x + nasoWidth, y: rightMouth.y }, imageWidth, imageHeight),
    toIntCoords({ x: rightMouth.x - nasoWidth, y: rightMouth.y }, imageWidth, imageHeight)
  ];
  zones.push({
    name: 'nasolabial_right',
    polygon: createClockwisePolygon(rightNasoPoints),
    confidence: 0.85
  });

  zones.push({
    name: 'lower_cheek_left',
    polygon: createClockwisePolygon([
      toIntCoords({ x: leftEyeOuter.x - (faceWidth / imageWidth) * 0.10, y: noseTip.y + (faceHeight / imageHeight) * 0.05 }, imageWidth, imageHeight),
      toIntCoords({ x: leftMouth.x - (faceWidth / imageWidth) * 0.03, y: noseTip.y + (faceHeight / imageHeight) * 0.05 }, imageWidth, imageHeight),
      toIntCoords({ x: leftMouth.x - (faceWidth / imageWidth) * 0.03, y: leftMouth.y + (faceHeight / imageHeight) * 0.08 }, imageWidth, imageHeight),
      toIntCoords({ x: leftEyeOuter.x - (faceWidth / imageWidth) * 0.10, y: leftMouth.y + (faceHeight / imageHeight) * 0.08 }, imageWidth, imageHeight)
    ]),
    confidence: 0.87
  });

  zones.push({
    name: 'lower_cheek_right',
    polygon: createClockwisePolygon([
      toIntCoords({ x: rightMouth.x + (faceWidth / imageWidth) * 0.03, y: noseTip.y + (faceHeight / imageHeight) * 0.05 }, imageWidth, imageHeight),
      toIntCoords({ x: rightEyeOuter.x + (faceWidth / imageWidth) * 0.10, y: noseTip.y + (faceHeight / imageHeight) * 0.05 }, imageWidth, imageHeight),
      toIntCoords({ x: rightEyeOuter.x + (faceWidth / imageWidth) * 0.10, y: rightMouth.y + (faceHeight / imageHeight) * 0.08 }, imageWidth, imageHeight),
      toIntCoords({ x: rightMouth.x + (faceWidth / imageWidth) * 0.03, y: rightMouth.y + (faceHeight / imageHeight) * 0.08 }, imageWidth, imageHeight)
    ]),
    confidence: 0.87
  });

  return {
    zones,
    image_size: [imageWidth, imageHeight],
    status: 'OK'
  };
}

export function segmentationToYAML(result: SegmentationResult): string {
  let yaml = 'zones:\n';

  for (const zone of result.zones) {
    yaml += `  - name: ${zone.name}\n`;
    yaml += `    polygon: [`;
    yaml += zone.polygon.map(p => `[${p.x},${p.y}]`).join(', ');
    yaml += `]\n`;
    yaml += `    confidence: ${zone.confidence.toFixed(2)}\n`;
  }

  yaml += `image_size: [${result.image_size[0]}, ${result.image_size[1]}]\n`;
  yaml += `status: ${result.status}\n`;

  if (result.reason) {
    yaml += `reason: ${result.reason}\n`;
  }

  return yaml;
}
