import { useState } from 'react';
import { Settings, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { ZoneAdjustments, ZoneAdjustment } from '../lib/zoneAdjustments';

interface ZoneAdjustmentPanelProps {
  adjustments: ZoneAdjustments;
  onAdjustmentChange: (adjustments: ZoneAdjustments) => void;
  onReset: () => void;
}

const ZONE_LABELS: Record<keyof ZoneAdjustments, string> = {
  forehead: 'Forehead',
  between_eyebrows: 'Between Eyebrows',
  crows_feet_left: "Crow's Feet (Left)",
  crows_feet_right: "Crow's Feet (Right)",
  upper_cheek_left: 'Upper Cheek (Left)',
  upper_cheek_right: 'Upper Cheek (Right)',
  lower_cheek_left: 'Lower Cheek (Left)',
  lower_cheek_right: 'Lower Cheek (Right)',
  nasolabial_left: 'Nasolabial Fold (Left)',
  nasolabial_right: 'Nasolabial Fold (Right)',
};

export function ZoneAdjustmentPanel({ adjustments, onAdjustmentChange, onReset }: ZoneAdjustmentPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  const toggleZone = (zone: string) => {
    const newExpanded = new Set(expandedZones);
    if (newExpanded.has(zone)) {
      newExpanded.delete(zone);
    } else {
      newExpanded.add(zone);
    }
    setExpandedZones(newExpanded);
  };

  const updateZoneAdjustment = (
    zoneName: keyof ZoneAdjustments,
    property: keyof ZoneAdjustment,
    value: number
  ) => {
    const newAdjustments = {
      ...adjustments,
      [zoneName]: {
        ...adjustments[zoneName],
        [property]: value,
      },
    };
    onAdjustmentChange(newAdjustments);
  };

  const renderZoneControls = (zoneName: keyof ZoneAdjustments) => {
    const adjustment = adjustments[zoneName];
    const isExpanded = expandedZones.has(zoneName);

    return (
      <div key={zoneName} className="border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleZone(zoneName)}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <span className="font-medium text-sm">{ZONE_LABELS[zoneName]}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <div className="p-4 space-y-4 bg-white">
            <div>
              <Label className="text-xs">Horizontal Offset: {adjustment.offsetX.toFixed(2)}</Label>
              <Slider
                value={[adjustment.offsetX]}
                onValueChange={([value]) => updateZoneAdjustment(zoneName, 'offsetX', value)}
                min={-0.2}
                max={0.2}
                step={0.01}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs">Vertical Offset: {adjustment.offsetY.toFixed(2)}</Label>
              <Slider
                value={[adjustment.offsetY]}
                onValueChange={([value]) => updateZoneAdjustment(zoneName, 'offsetY', value)}
                min={-0.2}
                max={0.2}
                step={0.01}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs">Width Scale: {adjustment.scaleWidth.toFixed(2)}</Label>
              <Slider
                value={[adjustment.scaleWidth]}
                onValueChange={([value]) => updateZoneAdjustment(zoneName, 'scaleWidth', value)}
                min={0.5}
                max={2}
                step={0.05}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs">Height Scale: {adjustment.scaleHeight.toFixed(2)}</Label>
              <Slider
                value={[adjustment.scaleHeight]}
                onValueChange={([value]) => updateZoneAdjustment(zoneName, 'scaleHeight', value)}
                min={0.5}
                max={2}
                step={0.05}
                className="mt-2"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <CardTitle>Zone Adjustments</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {Object.keys(adjustments).map((zoneName) =>
              renderZoneControls(zoneName as keyof ZoneAdjustments)
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
