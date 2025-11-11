import { supabase } from './supabase';

export interface PrivacySettings {
  enableHistoricalContext: boolean;
  allowJournalAccess: boolean;
  allowTherapyHistoryAccess: boolean;
  allowSkinAnalysisAccess: boolean;
  historicalContextDays: number;
  lastPrivacyUpdate: string | null;
}

export interface DataAccessAuditLog {
  accessedAt: string;
  dataType: 'journal' | 'therapy_session' | 'skin_analysis' | 'comprehensive';
  recordCount: number;
  purpose: string;
}

export class PrivacyControlsService {
  async getPrivacySettings(): Promise<PrivacySettings | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          enable_historical_context,
          allow_journal_access,
          allow_therapy_history_access,
          allow_skin_analysis_access,
          historical_context_days,
          last_privacy_update
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        console.error('Error fetching privacy settings:', error);
        return this.getDefaultPrivacySettings();
      }

      return {
        enableHistoricalContext: data.enable_historical_context ?? true,
        allowJournalAccess: data.allow_journal_access ?? true,
        allowTherapyHistoryAccess: data.allow_therapy_history_access ?? true,
        allowSkinAnalysisAccess: data.allow_skin_analysis_access ?? true,
        historicalContextDays: data.historical_context_days ?? 90,
        lastPrivacyUpdate: data.last_privacy_update
      };
    } catch (error) {
      console.error('Error in getPrivacySettings:', error);
      return this.getDefaultPrivacySettings();
    }
  }

  private getDefaultPrivacySettings(): PrivacySettings {
    return {
      enableHistoricalContext: true,
      allowJournalAccess: true,
      allowTherapyHistoryAccess: true,
      allowSkinAnalysisAccess: true,
      historicalContextDays: 90,
      lastPrivacyUpdate: null
    };
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const updateData: any = {
        last_privacy_update: new Date().toISOString()
      };

      if (settings.enableHistoricalContext !== undefined) {
        updateData.enable_historical_context = settings.enableHistoricalContext;
      }
      if (settings.allowJournalAccess !== undefined) {
        updateData.allow_journal_access = settings.allowJournalAccess;
      }
      if (settings.allowTherapyHistoryAccess !== undefined) {
        updateData.allow_therapy_history_access = settings.allowTherapyHistoryAccess;
      }
      if (settings.allowSkinAnalysisAccess !== undefined) {
        updateData.allow_skin_analysis_access = settings.allowSkinAnalysisAccess;
      }
      if (settings.historicalContextDays !== undefined) {
        const clampedDays = Math.min(Math.max(settings.historicalContextDays, 7), 365);
        updateData.historical_context_days = clampedDays;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating privacy settings:', error);
        return false;
      }

      console.log('Privacy settings updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updatePrivacySettings:', error);
      return false;
    }
  }

  async canAccessJournals(): Promise<boolean> {
    const settings = await this.getPrivacySettings();
    return settings ? settings.enableHistoricalContext && settings.allowJournalAccess : false;
  }

  async canAccessTherapyHistory(): Promise<boolean> {
    const settings = await this.getPrivacySettings();
    return settings ? settings.enableHistoricalContext && settings.allowTherapyHistoryAccess : false;
  }

  async canAccessSkinAnalyses(): Promise<boolean> {
    const settings = await this.getPrivacySettings();
    return settings ? settings.enableHistoricalContext && settings.allowSkinAnalysisAccess : false;
  }

  async getContextDaysLimit(): Promise<number> {
    const settings = await this.getPrivacySettings();
    return settings?.historicalContextDays ?? 90;
  }

  async checkDataAccess(dataType: 'journal' | 'therapy_session' | 'skin_analysis'): Promise<boolean> {
    const settings = await this.getPrivacySettings();

    if (!settings || !settings.enableHistoricalContext) {
      return false;
    }

    switch (dataType) {
      case 'journal':
        return settings.allowJournalAccess;
      case 'therapy_session':
        return settings.allowTherapyHistoryAccess;
      case 'skin_analysis':
        return settings.allowSkinAnalysisAccess;
      default:
        return false;
    }
  }

  async enableAllDataAccess(): Promise<boolean> {
    return await this.updatePrivacySettings({
      enableHistoricalContext: true,
      allowJournalAccess: true,
      allowTherapyHistoryAccess: true,
      allowSkinAnalysisAccess: true
    });
  }

  async disableAllDataAccess(): Promise<boolean> {
    return await this.updatePrivacySettings({
      enableHistoricalContext: false
    });
  }

  async getPrivacySummary(): Promise<string> {
    const settings = await this.getPrivacySettings();

    if (!settings) {
      return 'Unable to load privacy settings.';
    }

    if (!settings.enableHistoricalContext) {
      return 'Historical data access is disabled. The AI therapist uses only current conversation context.';
    }

    const enabledAccess: string[] = [];
    if (settings.allowJournalAccess) enabledAccess.push('journal entries');
    if (settings.allowTherapyHistoryAccess) enabledAccess.push('past conversations');
    if (settings.allowSkinAnalysisAccess) enabledAccess.push('skin analysis history');

    if (enabledAccess.length === 0) {
      return 'Historical context is enabled but no specific data types are accessible.';
    }

    return `AI therapist can access: ${enabledAccess.join(', ')} from the last ${settings.historicalContextDays} days.`;
  }

  async resetToDefaults(): Promise<boolean> {
    return await this.updatePrivacySettings({
      enableHistoricalContext: true,
      allowJournalAccess: true,
      allowTherapyHistoryAccess: true,
      allowSkinAnalysisAccess: true,
      historicalContextDays: 90
    });
  }

  validatePrivacySettings(settings: Partial<PrivacySettings>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.historicalContextDays !== undefined) {
      if (settings.historicalContextDays < 7) {
        errors.push('Historical context must be at least 7 days');
      }
      if (settings.historicalContextDays > 365) {
        errors.push('Historical context cannot exceed 365 days');
      }
    }

    if (!settings.enableHistoricalContext) {
      if (settings.allowJournalAccess || settings.allowTherapyHistoryAccess || settings.allowSkinAnalysisAccess) {
        errors.push('Cannot enable specific data access when master switch is off');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const privacyControlsService = new PrivacyControlsService();
