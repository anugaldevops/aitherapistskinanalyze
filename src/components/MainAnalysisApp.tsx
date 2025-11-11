import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Sparkles, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AnimatedLoader } from './AnimatedLoader';
import { ZoneAdjustmentPanel } from './ZoneAdjustmentPanel';
import { loadMediaPipeModels, detectFaceLandmarks, CLINICAL_ZONES, ZONE_LEGEND } from '../lib/mediaPipe';
import { loadAdjustments, saveAdjustments, resetAdjustments, ZoneAdjustments } from '../lib/zoneAdjustments';
import { applyRectAdjustment } from '../lib/zoneDrawing';
import { drawPolygonZones } from '../lib/drawPolygonZones';
import { analyzeFacialZones, ClinicalScore } from '../lib/clinicalScoring';
import { ClinicalScoreDisplay } from './ClinicalScoreDisplay';
import { calculateSkinAge, SkinAgeEstimate } from '../lib/skinAgeCalculation';
import { SkinAgeEstimate as SkinAgeEstimateComponent } from './SkinAgeEstimate';
import { FuturePrediction } from './FuturePrediction';
import { PhotoTips } from './PhotoTips';
import { AnalysisHistory } from './AnalysisHistory';
import { AnalysisComparison } from './AnalysisComparison';
import { AutomaticComparison, FirstAnalysisWelcome } from './AutomaticComparison';
import { SavedAnalysis } from '../lib/analysisHistory';
import { saveAnalysis, getHistoryCount, getAnalysisHistory } from '../lib/analysisHistoryDb';
import { UserProfileMenu } from './UserProfileMenu';
import { ProfileSetupModal } from './ProfileSetupModal';
import { ProfileSettings } from './ProfileSettings';
import { AnalysisInfoForm } from './AnalysisInfoForm';
import { SkincareRoutine } from './SkincareRoutine';
import { NextScanReminder } from './NextScanReminder';
import { Dashboard } from './Dashboard';
import { reminderService } from '../lib/reminderService';
import { useAuth } from '../contexts/AuthContext';

export interface AnalysisMetadata {
  photoDate: string;
  ageInPhoto: number;
  skincareRoutine: string;
  lifestyleHabits: string[];
  notes: string;
}

export function MainAnalysisApp() {
  const { profile } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'analysis'>('dashboard');
  const [age, setAge] = useState<string>(profile?.age?.toString() || '');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsReady, setModelsReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectionError, setDetectionError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [landmarks, setLandmarks] = useState<any>(null);
  const [showZones, setShowZones] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [zoneAdjustments, setZoneAdjustments] = useState<ZoneAdjustments>(loadAdjustments());
  const [clinicalScore, setClinicalScore] = useState<ClinicalScore | null>(null);
  const [skinAgeEstimate, setSkinAgeEstimate] = useState<SkinAgeEstimate | null>(null);
  const [showFuturePrediction, setShowFuturePrediction] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [compareAnalyses, setCompareAnalyses] = useState<[SavedAnalysis, SavedAnalysis] | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);
  const [analysisIsSaved, setAnalysisIsSaved] = useState(false);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [analysisMetadata, setAnalysisMetadata] = useState<AnalysisMetadata | null>(null);
  const [automaticComparison, setAutomaticComparison] = useState<{ current: SavedAnalysis; previous: SavedAnalysis } | null>(null);
  const [isFirstAnalysis, setIsFirstAnalysis] = useState(false);
  const [showRoutine, setShowRoutine] = useState(false);
  const [showNextScanReminder, setShowNextScanReminder] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (profile?.age && age !== profile.age.toString()) {
      setAge(profile.age.toString());
    }
  }, [profile?.age]);

  useEffect(() => {
    let mounted = true;

    const loadHistoryCount = async () => {
      const count = await getHistoryCount();
      if (mounted) {
        setHistoryCount(count);
      }
    };

    loadHistoryCount();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      console.log('🔔 Initializing reminder service');
      reminderService.startReminderChecks();
    }

    return () => {
      reminderService.stopReminderChecks();
    };
  }, []);

  const handleFileChange = useCallback((file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      if (profile && !profile.profile_completed) {
        setShowProfileSetup(true);
        return;
      }

      console.log('=== NEW IMAGE UPLOAD ===');
      console.log('Clearing all previous state');

      setFaceDetected(false);
      setDetectionError(false);
      setErrorMessage('');
      setLandmarks(null);
      setShowZones(false);
      setIsAnalyzing(false);
      setClinicalScore(null);
      setSkinAgeEstimate(null);
      setShowFuturePrediction(false);
      setAnalysisIsSaved(false);
      setAnalysisMetadata(null);
      setCurrentView('analysis');

      setPendingImageFile(file);
      setShowAnalysisForm(true);
    }
  }, [profile]);

  const handleAnalysisFormSubmit = (metadata: AnalysisMetadata) => {
    console.log('=== ANALYSIS INFO SUBMITTED ===');
    console.log('Photo date:', metadata.photoDate);
    console.log('Age in photo:', metadata.ageInPhoto);
    console.log('Metadata:', metadata);

    setAge(metadata.ageInPhoto.toString());
    setAnalysisMetadata(metadata);
    setShowAnalysisForm(false);

    if (pendingImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('Image file read complete');
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(pendingImageFile);
    }
  };

  const handleAnalysisFormCancel = () => {
    setShowAnalysisForm(false);
    setPendingImageFile(null);
  };

  const analyzeFace = async (isRetry = false) => {
    console.log('=== MEDIAPIPE FACE DETECTION STARTED ===');
    console.log('Is retry attempt:', isRetry);
    console.log('MediaPipe models loaded:', modelsReady);

    if (!imageRef.current) {
      console.log('Cannot analyze: image not ready');
      return;
    }

    if (!modelsReady) {
      console.log('MediaPipe not ready');
      setDetectionError(true);
      setErrorMessage('MediaPipe not ready. Please wait and try again.');
      setIsAnalyzing(false);
      setUploadStatus('');
      return;
    }

    console.log('Face detection started');
    setIsAnalyzing(true);
    setFaceDetected(false);
    setDetectionError(false);
    setErrorMessage('');
    setUploadStatus('Analyzing facial features...');

    try {
      console.log('Calling MediaPipe detection...');
      const landmarks = await detectFaceLandmarks(imageRef.current);

      console.log('Detection complete. Result:', landmarks ? 'FACE FOUND' : 'NO FACE');

      if (landmarks) {
        console.log('Face found: yes');
        console.log(`Number of landmarks detected: ${landmarks.length}`);
        console.log('Showing results now');

        setFaceDetected(true);
        setLandmarks(landmarks);
        setUploadStatus('Face detected successfully!');

        await new Promise(resolve => setTimeout(resolve, 100));

        requestAnimationFrame(() => {
          setTimeout(() => {
            drawLandmarks(landmarks);
            console.log('Landmarks drawn on canvas');
          }, 50);
        });
      } else {
        console.log('Face found: no');

        if (!isRetry) {
          console.log('First attempt failed, retrying once...');
          setUploadStatus('Retrying detection...');
          await new Promise(resolve => setTimeout(resolve, 500));
          return analyzeFace(true);
        }

        console.log('Setting error: No face detected after retry');
        setDetectionError(true);
        setErrorMessage('No face detected. Please upload a clear selfie.');
        setUploadStatus('');
      }

    } catch (error) {
      console.error('Detection error:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));

      if (!isRetry) {
        console.log('Error on first attempt, retrying once...');
        setUploadStatus('Error occurred, retrying...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return analyzeFace(true);
      }

      setDetectionError(true);
      setErrorMessage('Detection failed. Please try uploading a different photo.');
      setUploadStatus('');
    } finally {
      console.log('Stopping analyzing animation');
      setIsAnalyzing(false);
      console.log('=== FACE DETECTION COMPLETE ===');
    }
  };

  const drawLandmarks = (landmarks: any) => {
    if (!canvasRef.current || !imageRef.current) {
      console.log('Cannot draw landmarks: canvas or image ref missing');
      return;
    }

    const canvas = canvasRef.current;
    const image = imageRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Cannot get canvas context');
      return;
    }

    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    console.log('Image dimensions:', {
      naturalWidth: imageWidth,
      naturalHeight: imageHeight,
      displayWidth: image.clientWidth,
      displayHeight: image.clientHeight
    });

    canvas.width = imageWidth;
    canvas.height = imageHeight;

    console.log('Canvas dimensions:', {
      width: canvas.width,
      height: canvas.height
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, imageWidth, imageHeight);

    console.log(`Drawing ${landmarks.length} MediaPipe landmark points on canvas`);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 0.5;

    landmarks.forEach((point: any, index: number) => {
      const x = point.x * imageWidth;
      const y = point.y * imageHeight;

      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      if (index === 0) {
        console.log('First landmark position:', { x, y, normalized: point });
      }
    });

    console.log('MediaPipe landmarks drawn successfully');
  };

  const drawZones = () => {
    if (!canvasRef.current || !imageRef.current || !landmarks) {
      console.log('Cannot draw zones: missing refs or landmarks');
      return;
    }

    const canvas = canvasRef.current;
    const image = imageRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Cannot get canvas context');
      return;
    }

    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    console.log('=== DRAWING LANDMARK-BASED ZONES ===');
    console.log(`Using ${landmarks.length} MediaPipe landmarks`);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, imageWidth, imageHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const getLandmark = (idx: number) => ({
      x: landmarks[idx].x * imageWidth,
      y: landmarks[idx].y * imageHeight
    });

    const allYCoords = landmarks.map((l: any) => l.y * imageHeight);
    const allXCoords = landmarks.map((l: any) => l.x * imageWidth);
    const faceTop = Math.min(...allYCoords);
    const faceBottom = Math.max(...allYCoords);
    const faceLeft = Math.min(...allXCoords);
    const faceRight = Math.max(...allXCoords);
    const faceWidth = faceRight - faceLeft;
    const faceHeight = faceBottom - faceTop;

    const leftEyeTop = getLandmark(159);
    const rightEyeTop = getLandmark(386);
    const eyeLineY = (leftEyeTop.y + rightEyeTop.y) / 2;

    const leftEyeOuter = getLandmark(33);
    const rightEyeOuter = getLandmark(263);

    const leftEyeInner = getLandmark(133);
    const rightEyeInner = getLandmark(362);

    const noseTip = getLandmark(1);

    const leftMouthCorner = getLandmark(61);
    const rightMouthCorner = getLandmark(291);

    const leftNoseSide = getLandmark(48);
    const rightNoseSide = getLandmark(278);

    console.log('=== KEY REFERENCE POINTS ===');
    console.log(`Face bounds: Top=${faceTop.toFixed(0)}, Bottom=${faceBottom.toFixed(0)}, Left=${faceLeft.toFixed(0)}, Right=${faceRight.toFixed(0)}`);
    console.log(`Eye line Y: ${eyeLineY.toFixed(0)}`);
    console.log(`Nose tip Y: ${noseTip.y.toFixed(0)}`);
    console.log(`Mouth line Y: ${((leftMouthCorner.y + rightMouthCorner.y) / 2).toFixed(0)}`);

    const getAdjustment = (type: string) => {
      const key = type as keyof ZoneAdjustments;
      return zoneAdjustments[key] || { offsetX: 0, offsetY: 0, scaleWidth: 1, scaleHeight: 1 };
    };

    const drawLandmarkZone = (zone: any, zoneName: string) => {
      const rgb = hexToRgb(zone.color);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${zone.opacity})`;
      const adj = getAdjustment(zone.type);

      if (zone.type === 'forehead') {
        const top = faceTop;
        const bottom = eyeLineY - (faceHeight * 0.02);
        const left = faceLeft;
        const right = faceRight;

        console.log(`${zoneName}: Rectangle from (${left.toFixed(0)}, ${top.toFixed(0)}) to (${right.toFixed(0)}, ${bottom.toFixed(0)})`);

        ctx.fillRect(left, top, right - left, bottom - top);
        ctx.strokeRect(left, top, right - left, bottom - top);

      } else if (zone.type === 'glabellar' || zone.type === 'between_eyebrows') {
        const centerX = (leftEyeInner.x + rightEyeInner.x) / 2;
        const centerY = eyeLineY - (faceHeight * 0.015);
        const width = faceWidth * 0.08;
        const height = faceHeight * 0.04;

        console.log(`${zoneName}: Center (${centerX.toFixed(0)}, ${centerY.toFixed(0)}), Size ${width.toFixed(0)}x${height.toFixed(0)}`);

        ctx.fillRect(centerX - width / 2, centerY - height / 2, width, height);
        ctx.strokeRect(centerX - width / 2, centerY - height / 2, width, height);

      } else if (zone.type === 'crows_feet_left') {
        const baseLeft = leftEyeOuter.x - (faceWidth * 0.08 * 1.2);
        const baseTop = leftEyeOuter.y - (faceHeight * 0.06 / 2);
        const { left, top, width, height } = applyRectAdjustment(
          baseLeft, baseTop, faceWidth * 0.08, faceHeight * 0.06, adj, faceWidth, faceHeight
        );

        console.log(`${zoneName}: Rect (${left.toFixed(0)}, ${top.toFixed(0)}), Size ${width.toFixed(0)}x${height.toFixed(0)}`);

        ctx.fillRect(left, top, width, height);
        ctx.strokeRect(left, top, width, height);

      } else if (zone.type === 'crows_feet_right') {
        const baseLeft = rightEyeOuter.x + (faceWidth * 0.08 * 0.2);
        const baseTop = rightEyeOuter.y - (faceHeight * 0.06 / 2);
        const { left, top, width, height } = applyRectAdjustment(
          baseLeft, baseTop, faceWidth * 0.08, faceHeight * 0.06, adj, faceWidth, faceHeight
        );

        console.log(`${zoneName}: Rect (${left.toFixed(0)}, ${top.toFixed(0)}), Size ${width.toFixed(0)}x${height.toFixed(0)}`);

        ctx.fillRect(left, top, width, height);
        ctx.strokeRect(left, top, width, height);

      } else if (zone.type === 'upper_cheek_left') {
        const baseTop = leftEyeOuter.y + (faceHeight * 0.02);
        const baseLeft = leftEyeOuter.x - (faceWidth * 0.08);
        const baseWidth = (leftEyeInner.x + (faceWidth * 0.02)) - baseLeft;
        const baseHeight = noseTip.y - baseTop;
        const { left, top, width, height } = applyRectAdjustment(
          baseLeft, baseTop, baseWidth, baseHeight, adj, faceWidth, faceHeight
        );

        console.log(`${zoneName}: Rectangle (${left.toFixed(0)}, ${top.toFixed(0)}) size ${width.toFixed(0)}x${height.toFixed(0)}`);

        ctx.fillRect(left, top, width, height);
        ctx.strokeRect(left, top, width, height);

      } else if (zone.type === 'upper_cheek_right') {
        const baseTop = rightEyeOuter.y + (faceHeight * 0.02);
        const baseLeft = rightEyeInner.x - (faceWidth * 0.02);
        const baseWidth = (rightEyeOuter.x + (faceWidth * 0.08)) - baseLeft;
        const baseHeight = noseTip.y - baseTop;
        const { left, top, width, height } = applyRectAdjustment(
          baseLeft, baseTop, baseWidth, baseHeight, adj, faceWidth, faceHeight
        );

        console.log(`${zoneName}: Rectangle (${left.toFixed(0)}, ${top.toFixed(0)}) size ${width.toFixed(0)}x${height.toFixed(0)}`);

        ctx.fillRect(left, top, width, height);
        ctx.strokeRect(left, top, width, height);

      } else if (zone.type === 'nasolabial_left') {
        const startX = leftNoseSide.x;
        const startY = leftNoseSide.y;
        const endX = leftMouthCorner.x;
        const endY = leftMouthCorner.y;

        const dx = endX - startX;
        const dy = endY - startY;
        const len = Math.sqrt(dx * dx + dy * dy);
        const width = faceWidth * 0.025;
        const perpX = (-dy / len) * (width / 2);
        const perpY = (dx / len) * (width / 2);

        console.log(`${zoneName}: Line from (${startX.toFixed(0)}, ${startY.toFixed(0)}) to (${endX.toFixed(0)}, ${endY.toFixed(0)}), Width ${width.toFixed(0)}`);

        ctx.beginPath();
        ctx.moveTo(startX + perpX, startY + perpY);
        ctx.lineTo(endX + perpX, endY + perpY);
        ctx.lineTo(endX - perpX, endY - perpY);
        ctx.lineTo(startX - perpX, startY - perpY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

      } else if (zone.type === 'nasolabial_right') {
        const startX = rightNoseSide.x;
        const startY = rightNoseSide.y;
        const endX = rightMouthCorner.x;
        const endY = rightMouthCorner.y;

        const dx = endX - startX;
        const dy = endY - startY;
        const len = Math.sqrt(dx * dx + dy * dy);
        const width = faceWidth * 0.025;
        const perpX = (-dy / len) * (width / 2);
        const perpY = (dx / len) * (width / 2);

        console.log(`${zoneName}: Line from (${startX.toFixed(0)}, ${startY.toFixed(0)}) to (${endX.toFixed(0)}, ${endY.toFixed(0)}), Width ${width.toFixed(0)}`);

        ctx.beginPath();
        ctx.moveTo(startX + perpX, startY + perpY);
        ctx.lineTo(endX + perpX, endY + perpY);
        ctx.lineTo(endX - perpX, endY - perpY);
        ctx.lineTo(startX - perpX, startY - perpY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

      } else if (zone.type === 'lower_cheek_left') {
        const baseTop = noseTip.y + (faceHeight * 0.05);
        const baseLeft = leftEyeOuter.x - (faceWidth * 0.10);
        const baseWidth = (leftMouthCorner.x - (faceWidth * 0.03)) - baseLeft;
        const baseHeight = (leftMouthCorner.y + (faceHeight * 0.08)) - baseTop;
        const { left, top, width, height } = applyRectAdjustment(
          baseLeft, baseTop, baseWidth, baseHeight, adj, faceWidth, faceHeight
        );

        console.log(`${zoneName}: Rectangle (${left.toFixed(0)}, ${top.toFixed(0)}) size ${width.toFixed(0)}x${height.toFixed(0)}`);

        ctx.fillRect(left, top, width, height);
        ctx.strokeRect(left, top, width, height);

      } else if (zone.type === 'lower_cheek_right') {
        const baseTop = noseTip.y + (faceHeight * 0.05);
        const baseLeft = rightMouthCorner.x + (faceWidth * 0.03);
        const baseWidth = (rightEyeOuter.x + (faceWidth * 0.10)) - baseLeft;
        const baseHeight = (rightMouthCorner.y + (faceHeight * 0.08)) - baseTop;
        const { left, top, width, height } = applyRectAdjustment(
          baseLeft, baseTop, baseWidth, baseHeight, adj, faceWidth, faceHeight
        );

        console.log(`${zoneName}: Rectangle (${left.toFixed(0)}, ${top.toFixed(0)}) size ${width.toFixed(0)}x${height.toFixed(0)}`);

        ctx.fillRect(left, top, width, height);
        ctx.strokeRect(left, top, width, height);
      }
    };

    drawLandmarkZone(CLINICAL_ZONES.ZONE_1_FOREHEAD, 'Zone 1 - Forehead');
    drawLandmarkZone(CLINICAL_ZONES.ZONE_2_GLABELLAR, 'Zone 2 - Between Eyebrows');
    drawLandmarkZone(CLINICAL_ZONES.ZONE_3A_LEFT_CROWS_FEET, 'Zone 3A - Left Crow\'s Feet');
    drawLandmarkZone(CLINICAL_ZONES.ZONE_3B_RIGHT_CROWS_FEET, 'Zone 3B - Right Crow\'s Feet');
    drawLandmarkZone(CLINICAL_ZONES.ZONE_4A_LEFT_UPPER_CHEEK, 'Zone 4A - Left Upper Cheek');
    drawLandmarkZone(CLINICAL_ZONES.ZONE_4B_RIGHT_UPPER_CHEEK, 'Zone 4B - Right Upper Cheek');
    drawLandmarkZone(CLINICAL_ZONES.ZONE_5A_LEFT_NASOLABIAL, 'Zone 5A - Left Nasolabial Fold');
    drawLandmarkZone(CLINICAL_ZONES.ZONE_5B_RIGHT_NASOLABIAL, 'Zone 5B - Right Nasolabial Fold');
    drawLandmarkZone(CLINICAL_ZONES.ZONE_6A_LEFT_LOWER_CHEEK, 'Zone 6A - Left Lower Cheek');
    drawLandmarkZone(CLINICAL_ZONES.ZONE_6B_RIGHT_LOWER_CHEEK, 'Zone 6B - Right Lower Cheek');

    console.log('=== ALL 10 ZONES DRAWN SUCCESSFULLY ===');
  };

  const drawPolygonBasedZones = () => {
    if (!canvasRef.current || !imageRef.current || !landmarks) {
      console.log('Cannot draw zones: missing refs or landmarks');
      return;
    }

    const canvas = canvasRef.current;
    const image = imageRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Cannot get canvas context');
      return;
    }

    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, imageWidth, imageHeight);

    const { yaml, result } = drawPolygonZones(ctx, landmarks, imageWidth, imageHeight);
    console.log('Generated YAML output (for debugging):\n', yaml);

    if (result.status === 'OK' && result.zones) {
      console.log('Performing clinical analysis...');
      const score = analyzeFacialZones(ctx, result.zones, imageWidth, imageHeight);
      setClinicalScore(score);
      console.log('Clinical score:', score);
    }
  };

  const handleContinueAnalysis = () => {
    setShowZones(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        drawPolygonBasedZones();
      }, 100);
    });
  };

  const handleAdjustmentChange = (newAdjustments: ZoneAdjustments) => {
    setZoneAdjustments(newAdjustments);
    saveAdjustments(newAdjustments);
    if (showZones) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          drawZones();
        }, 10);
      });
    }
  };

  const handleResetAdjustments = () => {
    const defaultAdj = resetAdjustments();
    setZoneAdjustments(defaultAdj);
    if (showZones) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          drawZones();
        }, 10);
      });
    }
  };

  const handleCalculateSkinAge = () => {
    console.log('=== CALCULATE SKIN AGE BUTTON CLICKED ===');
    console.log('Current age state value:', age);

    if (!clinicalScore) {
      console.error('No clinical score available');
      alert('Clinical analysis not found. Please try analyzing the image again.');
      return;
    }

    const actualAge = parseInt(age);
    console.log('Parsed age value:', actualAge);

    if (!age || isNaN(actualAge) || actualAge < 18 || actualAge > 80) {
      console.error('Age validation failed:', { age, actualAge });
      alert('Please enter your age first (18-80 years)');
      return;
    }

    console.log('✓ Age validation passed');
    console.log('Calculating skin age estimate with actual age:', actualAge);
    const estimate = calculateSkinAge(clinicalScore, actualAge);
    setSkinAgeEstimate(estimate);
  };

  const handleShowFuturePrediction = () => {
    console.log('=== SHOW FUTURE PREDICTION BUTTON CLICKED ===');
    setShowFuturePrediction(true);

    if (analysisIsSaved && !isFirstAnalysis && !automaticComparison) {
      console.log('📅 Showing next scan reminder dialog');
      setShowNextScanReminder(true);
    }
  };

  const handleRestartAnalysis = useCallback(async () => {
    console.log('=== RESTART ANALYSIS ===');
    setUploadedImage(null);
    setFaceDetected(false);
    setDetectionError(false);
    setErrorMessage('');
    setLandmarks(null);
    setShowZones(false);
    setClinicalScore(null);
    setSkinAgeEstimate(null);
    setShowFuturePrediction(false);
    setAnalysisIsSaved(false);
    setIsSavingAnalysis(false);
    setAutomaticComparison(null);
    setIsFirstAnalysis(false);
    const count = await getHistoryCount();
    setHistoryCount(count);
  }, []);

  const handleSaveAnalysis = async () => {
    if (!skinAgeEstimate || !clinicalScore || !age) {
      console.error('Missing required data for saving analysis');
      return;
    }

    setIsSavingAnalysis(true);

    try {
      console.log('💾 Saving analysis and checking for automatic comparison...');

      const previousAnalyses = await getAnalysisHistory('photo_date', false);
      console.log(`Found ${previousAnalyses.length} previous analyses`);

      const actualAge = parseInt(age);
      const result = await saveAnalysis(
        skinAgeEstimate,
        clinicalScore,
        actualAge,
        analysisMetadata || undefined
      );

      if (result) {
        setAnalysisIsSaved(true);
        const count = await getHistoryCount();
        setHistoryCount(count);
        console.log('✅ Analysis saved to profile');

        if (previousAnalyses.length === 0) {
          console.log('🎉 This is the user\'s first analysis!');
          setIsFirstAnalysis(true);
          setAutomaticComparison(null);
        } else {
          const mostRecentPrevious = previousAnalyses[0];

          const currentPhotoDate = result.photoDate || result.date;
          const previousPhotoDate = mostRecentPrevious.photoDate || mostRecentPrevious.date;

          const daysBetween = Math.floor(
            (new Date(currentPhotoDate).getTime() - new Date(previousPhotoDate).getTime()) / (1000 * 60 * 60 * 24)
          );

          console.log(`📊 Time since last analysis: ${daysBetween} days`);
          console.log(`Previous analysis from: ${previousPhotoDate}`);
          console.log(`Current analysis from: ${currentPhotoDate}`);

          if (daysBetween >= 7) {
            console.log('✅ 7+ days have passed - showing automatic comparison');
            setAutomaticComparison({
              current: result,
              previous: mostRecentPrevious
            });
            setIsFirstAnalysis(false);
          } else {
            console.log('⏰ Less than 7 days since last analysis - no automatic comparison');
            setAutomaticComparison(null);
            setIsFirstAnalysis(false);
          }
        }
      } else {
        console.error('❌ Failed to save analysis');
        alert('Unable to save. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error saving analysis:', error);
      alert('Unable to save. Please try again.');
    } finally {
      setIsSavingAnalysis(false);
    }
  };

  const handleOpenHistory = async () => {
    setShowHistory(true);
    const count = await getHistoryCount();
    setHistoryCount(count);
  };

  const handleCloseHistory = async () => {
    setShowHistory(false);
    const count = await getHistoryCount();
    setHistoryCount(count);
  };

  const handleCompare = (analysis1: SavedAnalysis, analysis2: SavedAnalysis) => {
    setCompareAnalyses([analysis1, analysis2]);
    setShowHistory(false);
  };

  const handleCloseComparison = () => {
    setCompareAnalyses(null);
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setFaceDetected(false);
    setDetectionError(false);
    setErrorMessage('');
    setLandmarks(null);
    setShowZones(false);
  };

  useEffect(() => {
    if (!uploadedImage || !imageRef.current || !modelsReady) {
      return;
    }

    console.log('Image uploaded, setting up onload handler with 100ms delay');
    let timeoutId: NodeJS.Timeout;

    if (imageRef.current.complete) {
      console.log('Image already loaded, waiting 100ms before analysis');
      timeoutId = setTimeout(() => {
        console.log('Starting analysis after delay');
        analyzeFace();
      }, 100);
    } else {
      console.log('Image not loaded yet, waiting for onload event');
      const currentImage = imageRef.current;
      const handleLoad = () => {
        console.log('Image onload event fired, waiting 100ms before analysis');
        timeoutId = setTimeout(() => {
          console.log('Starting analysis after delay');
          analyzeFace();
        }, 100);
      };
      currentImage.onload = handleLoad;

      return () => {
        currentImage.onload = null;
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [uploadedImage, modelsReady]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  useEffect(() => {
    const initializeModels = async () => {
      try {
        const loaded = await loadMediaPipeModels();
        setModelsReady(loaded);
        setModelsLoading(false);
      } catch (error) {
        console.error('Failed to load MediaPipe:', error);
        setModelsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      initializeModels();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (showSettings) {
    return <ProfileSettings onBack={() => setShowSettings(false)} />;
  }

  if (currentView === 'dashboard') {
    return (
      <>
        {showSettings && <ProfileSettings onBack={() => setShowSettings(false)} />}
        {showRoutine && <SkincareRoutine onClose={() => setShowRoutine(false)} />}
        {showHistory && (
          <AnalysisHistory
            onClose={() => setShowHistory(false)}
            onCompare={(analysis1, analysis2) => {
              setCompareAnalyses([analysis1, analysis2]);
              setShowHistory(false);
            }}
          />
        )}
        <Dashboard
          onTakeNewScan={() => setCurrentView('analysis')}
          onViewRoutine={() => setShowRoutine(true)}
          onViewAnalysis={(analysisId: string) => {
            console.log('View analysis:', analysisId);
            setShowHistory(true);
          }}
          onViewHistory={() => setShowHistory(true)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('dashboard')}
          >
            ← Back to Dashboard
          </Button>
          <UserProfileMenu
            onViewAnalyses={handleOpenHistory}
            onViewProfile={() => setShowSettings(true)}
            onViewRoutine={() => setShowRoutine(true)}
          />
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-teal-600" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              SkinAge AI
            </h1>
          </div>
          <p className="text-xl text-slate-600 font-medium">
            Clinical-Grade Facial Analysis
          </p>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Advanced AI-powered skin analysis technology used by dermatology professionals worldwide
          </p>

          {modelsLoading ? (
            <div className="mt-6">
              <AnimatedLoader />
            </div>
          ) : (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-blue-200 shadow-sm">
                {modelsReady ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span className="text-sm font-medium text-teal-700">Ready to analyze</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-red-600">Failed to load models</span>
                  </>
                )}
              </div>
              {historyCount > 0 && (
                <Button
                  onClick={handleOpenHistory}
                  variant="outline"
                  className="border-2 border-blue-400 text-blue-700 hover:bg-blue-100 font-semibold gap-2 shadow-sm"
                >
                  <History className="w-4 h-4" />
                  View History ({historyCount})
                </Button>
              )}
            </div>
          )}
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="max-w-sm mx-auto bg-gradient-to-br from-blue-50 to-teal-50 p-6 rounded-xl border-2 border-blue-200">
                <Label htmlFor="age" className="text-lg font-bold text-slate-800 mb-3 block text-center">
                  Your Age:
                </Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="80"
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    console.log('Age input changed:', e.target.value);
                    if (detectionError && errorMessage.includes('age')) {
                      setDetectionError(false);
                      setErrorMessage('');
                    }
                  }}
                  placeholder="Enter your age"
                  className="text-center text-2xl font-bold h-14 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
                <p className="text-sm text-slate-600 mt-3 text-center font-medium">
                  (Required for skin age analysis)
                </p>
              </div>

              {detectionError && errorMessage.includes('age') && !uploadedImage && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800 font-semibold">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              {!uploadedImage && <PhotoTips />}

              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleInputChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                      border-3 border-dashed rounded-2xl p-12 text-center
                      transition-all duration-300 ease-in-out
                      ${isDragging
                        ? 'border-teal-500 bg-teal-50 scale-[1.02]'
                        : 'border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 hover:border-teal-400 hover:bg-teal-50/50'
                      }
                    `}
                  >
                    <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-teal-600' : 'text-blue-400'} transition-colors`} />
                    <div className="inline-block bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all rounded-md">
                      Upload Selfie
                    </div>
                    <p className="text-sm text-slate-500 mt-4">
                      or drag and drop your photo here
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Supports JPG, PNG (Max 10MB)
                    </p>
                  </div>
                </label>
              </div>

              {uploadedImage && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {isAnalyzing ? (
                    <Card className="overflow-hidden border-2 border-blue-200 shadow-xl">
                      <CardContent className="p-6">
                        <AnimatedLoader />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="overflow-hidden border-2 border-blue-200 shadow-xl">
                      <CardContent className="p-6">
                        {uploadStatus && !faceDetected && !detectionError && (
                          <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                            <p className="text-base font-semibold text-blue-700">
                              {uploadStatus}
                            </p>
                          </div>
                        )}

                        {faceDetected && !detectionError && (
                          <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
                            <CheckCircle2 className="w-6 h-6 text-teal-600" />
                            <p className="text-base font-bold text-teal-700">
                              Face detected successfully ✓
                            </p>
                          </div>
                        )}

                        {detectionError && (
                          <Alert className="mb-4 border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-900">
                              <p className="font-semibold mb-2">
                                {errorMessage.includes('No face detected')
                                  ? 'No face detected'
                                  : errorMessage}
                              </p>
                              {errorMessage.includes('No face detected') && (
                                <p className="text-sm">Please upload a clear selfie with your face visible.</p>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className={`flex ${showZones ? 'gap-6' : 'flex-col'}`}>
                          <div className={`rounded-xl overflow-hidden shadow-lg relative flex items-center justify-center bg-slate-50 ${showZones ? 'flex-1' : ''}`}>
                            <img
                              ref={imageRef}
                              src={uploadedImage}
                              alt="Uploaded selfie"
                              className={`w-full h-auto max-h-96 object-contain ${landmarks ? 'invisible' : 'visible'}`}
                              crossOrigin="anonymous"
                            />
                            {landmarks && (
                              <canvas
                                ref={canvasRef}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-full max-h-96 w-auto h-auto pointer-events-none"
                              />
                            )}
                          </div>

                          {showZones && (
                            <div className="flex-shrink-0 w-64 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 shadow-lg border-2 border-slate-200">
                              <h3 className="text-lg font-bold text-slate-700 mb-4 text-center">Analysis Zones</h3>
                              <div className="space-y-3">
                                {ZONE_LEGEND.map((zone, index) => (
                                  <div key={index} className="flex items-center gap-3">
                                    <div
                                      className="w-6 h-6 rounded border-2 border-white shadow-sm flex-shrink-0"
                                      style={{ backgroundColor: zone.color }}
                                    />
                                    <span className="text-sm font-medium text-slate-700">{zone.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                          {detectionError ? (
                            <Button
                              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3"
                              onClick={resetUpload}
                            >
                              Try Another Photo
                            </Button>
                          ) : (
                            <>
                              {faceDetected && !showZones && (
                                <Button
                                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-bold py-4 text-lg shadow-lg"
                                  onClick={handleContinueAnalysis}
                                >
                                  Continue Analysis
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                className="w-full border-2 border-slate-300 hover:bg-slate-50"
                                onClick={resetUpload}
                              >
                                Upload Different Photo
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {showZones && landmarks && (
          <>
            <div className="mt-6">
              <ZoneAdjustmentPanel
                adjustments={zoneAdjustments}
                onAdjustmentChange={handleAdjustmentChange}
                onReset={handleResetAdjustments}
              />
            </div>

            {clinicalScore && !skinAgeEstimate && (
              <ClinicalScoreDisplay
                score={clinicalScore}
                onContinue={handleCalculateSkinAge}
              />
            )}

            {skinAgeEstimate && !showFuturePrediction && (
              <SkinAgeEstimateComponent
                estimate={skinAgeEstimate}
                onContinue={handleShowFuturePrediction}
                onSave={handleSaveAnalysis}
                isSaving={isSavingAnalysis}
                isSaved={analysisIsSaved}
                clinicalScore={clinicalScore?.totalScore}
                onOpenTherapist={() => {
                  const therapistButton = document.querySelector('[data-therapist-button]') as HTMLButtonElement;
                  if (therapistButton) therapistButton.click();
                }}
              />
            )}

            {analysisIsSaved && isFirstAnalysis && skinAgeEstimate && (
              <div className="mt-6">
                <FirstAnalysisWelcome
                  analysis={{
                    id: 'current',
                    date: new Date().toISOString(),
                    timestamp: Date.now(),
                    photoDate: analysisMetadata?.photoDate,
                    actualAge: parseInt(age),
                    ageInPhoto: analysisMetadata?.ageInPhoto,
                    skinAge: skinAgeEstimate.estimatedSkinAge,
                    clinicalScore: clinicalScore!.totalScore,
                    maxClinicalScore: clinicalScore!.maxScore,
                    compositeIndex: skinAgeEstimate.compositeIndex,
                    topProblemZones: [],
                    skincareRoutine: analysisMetadata?.skincareRoutine,
                    lifestyleHabits: analysisMetadata?.lifestyleHabits,
                    notes: analysisMetadata?.notes,
                    rawData: {
                      skinAgeEstimate,
                      clinicalScore: clinicalScore!
                    }
                  }}
                />
              </div>
            )}

            {analysisIsSaved && automaticComparison && (
              <div className="mt-6">
                <AutomaticComparison
                  currentAnalysis={automaticComparison.current}
                  previousAnalysis={automaticComparison.previous}
                  onSelectDifferent={() => {
                    setShowHistory(true);
                  }}
                />
              </div>
            )}

            {skinAgeEstimate && clinicalScore && showFuturePrediction && (
              <FuturePrediction
                skinAgeEstimate={skinAgeEstimate}
                clinicalScore={clinicalScore}
                onRestart={handleRestartAnalysis}
              />
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            Your privacy is protected. Images are analyzed securely and never stored without consent.
          </p>
        </div>
      </div>

      {showHistory && (
        <AnalysisHistory
          onClose={handleCloseHistory}
          onCompare={handleCompare}
        />
      )}

      {compareAnalyses && (
        <AnalysisComparison
          analysis1={compareAnalyses[0]}
          analysis2={compareAnalyses[1]}
          onClose={handleCloseComparison}
        />
      )}

      {showProfileSetup && (
        <ProfileSetupModal
          isOpen={showProfileSetup}
          onClose={() => setShowProfileSetup(false)}
        />
      )}

      {showAnalysisForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <AnalysisInfoForm
            currentAge={profile?.age || 30}
            onSubmit={handleAnalysisFormSubmit}
            onCancel={handleAnalysisFormCancel}
          />
        </div>
      )}

      {showRoutine && (
        <SkincareRoutine onClose={() => setShowRoutine(false)} />
      )}

      {showNextScanReminder && (
        <NextScanReminder
          onClose={() => setShowNextScanReminder(false)}
          onReminderSet={() => {
            console.log('✅ Next scan reminder set');
          }}
        />
      )}
    </div>
  );
}
