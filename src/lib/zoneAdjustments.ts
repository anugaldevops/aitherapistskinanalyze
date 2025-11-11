export interface ZoneAdjustment {
  offsetX: number;
  offsetY: number;
  scaleWidth: number;
  scaleHeight: number;
}

export interface ZoneAdjustments {
  forehead: ZoneAdjustment;
  between_eyebrows: ZoneAdjustment;
  crows_feet_left: ZoneAdjustment;
  crows_feet_right: ZoneAdjustment;
  upper_cheek_left: ZoneAdjustment;
  upper_cheek_right: ZoneAdjustment;
  lower_cheek_left: ZoneAdjustment;
  lower_cheek_right: ZoneAdjustment;
  nasolabial_left: ZoneAdjustment;
  nasolabial_right: ZoneAdjustment;
}

export const DEFAULT_ADJUSTMENTS: ZoneAdjustments = {
  forehead: { offsetX: 0, offsetY: 0, scaleWidth: 1, scaleHeight: 1 },
  between_eyebrows: { offsetX: 0, offsetY: 0, scaleWidth: 1, scaleHeight: 1 },
  crows_feet_left: { offsetX: 0, offsetY: 0, scaleWidth: 1, scaleHeight: 1 },
  crows_feet_right: { offsetX: 0, offsetY: 0, scaleWidth: 1, scaleHeight: 1 },
  upper_cheek_left: { offsetX: 0, offsetY: 0, scaleWidth: 1, scaleHeight: 1 },
  upper_cheek_right: { offsetX: 0, offsetY: 0, scaleWidth: 1, scaleHeight: 1 },
  lower_cheek_left: { offsetX: 0, offsetY: 0, scaleWidth: 1, scaleHeight: 1 },
  lower_cheek_right: { offsetX: 0, offsetY: 0, scaleWidth: 1, scaleHeight: 1 },
  nasolabial_left: { offsetX: 0, offsetY: 0, scaleWidth: 1, scaleHeight: 1 },
  nasolabial_right: { offsetX: 0, offsetY: 0, scaleWidth: 1, scaleHeight: 1 },
};

const STORAGE_KEY = 'facial_zone_adjustments';

export function saveAdjustments(adjustments: ZoneAdjustments): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(adjustments));
}

export function loadAdjustments(): ZoneAdjustments {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_ADJUSTMENTS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to load adjustments:', e);
    }
  }
  return DEFAULT_ADJUSTMENTS;
}

export function resetAdjustments(): ZoneAdjustments {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_ADJUSTMENTS;
}
