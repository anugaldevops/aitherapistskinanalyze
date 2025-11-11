import { supabase } from './supabase';

export interface JournalEntry {
  id: string;
  user_id: string;
  therapy_session_id: string | null;
  prompt: string;
  entry_text: string;
  entry_date: string;
  exercise_id: string;
  mood_at_time: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJournalEntryParams {
  prompt: string;
  entryText: string;
  therapySessionId?: string | null;
  exerciseId?: string;
  moodAtTime?: string;
}

export class JournalService {
  async saveJournalEntry(params: CreateJournalEntryParams): Promise<JournalEntry | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user for journal entry');
        return null;
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          therapy_session_id: params.therapySessionId || null,
          prompt: params.prompt,
          entry_text: params.entryText,
          exercise_id: params.exerciseId || '',
          mood_at_time: params.moodAtTime || ''
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error saving journal entry:', error);
        return null;
      }

      if (!data) {
        console.error('No data returned from journal entry insert');
        return null;
      }

      console.log('✅ Journal entry saved successfully:', data.id);
      return data;
    } catch (error) {
      console.error('Error in saveJournalEntry:', error);
      return null;
    }
  }

  async getRecentJournalEntries(limit: number = 5): Promise<JournalEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching journal entries:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentJournalEntries:', error);
      return [];
    }
  }

  async getJournalEntriesByDateRange(startDate: Date, endDate: Date): Promise<JournalEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', startDate.toISOString())
        .lte('entry_date', endDate.toISOString())
        .order('entry_date', { ascending: false });

      if (error) {
        console.error('Error fetching journal entries by date range:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getJournalEntriesByDateRange:', error);
      return [];
    }
  }

  async getJournalEntryById(entryId: string): Promise<JournalEntry | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching journal entry:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getJournalEntryById:', error);
      return null;
    }
  }

  async updateJournalEntry(entryId: string, entryText: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('journal_entries')
        .update({ entry_text: entryText })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating journal entry:', error);
        return false;
      }

      console.log('✅ Journal entry updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateJournalEntry:', error);
      return false;
    }
  }

  async deleteJournalEntry(entryId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting journal entry:', error);
        return false;
      }

      console.log('🗑️ Journal entry deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteJournalEntry:', error);
      return false;
    }
  }

  async getJournalStats(): Promise<{
    totalEntries: number;
    entriesThisWeek: number;
    entriesThisMonth: number;
    lastEntryDate: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          totalEntries: 0,
          entriesThisWeek: 0,
          entriesThisMonth: 0,
          lastEntryDate: null
        };
      }

      const { data: allEntries, error: allError } = await supabase
        .from('journal_entries')
        .select('entry_date')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (allError || !allEntries) {
        return {
          totalEntries: 0,
          entriesThisWeek: 0,
          entriesThisMonth: 0,
          lastEntryDate: null
        };
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const entriesThisWeek = allEntries.filter(entry =>
        new Date(entry.entry_date) >= oneWeekAgo
      ).length;

      const entriesThisMonth = allEntries.filter(entry =>
        new Date(entry.entry_date) >= oneMonthAgo
      ).length;

      return {
        totalEntries: allEntries.length,
        entriesThisWeek,
        entriesThisMonth,
        lastEntryDate: allEntries.length > 0 ? allEntries[0].entry_date : null
      };
    } catch (error) {
      console.error('Error in getJournalStats:', error);
      return {
        totalEntries: 0,
        entriesThisWeek: 0,
        entriesThisMonth: 0,
        lastEntryDate: null
      };
    }
  }

  async getJournalSummary(): Promise<string> {
    try {
      const entries = await this.getRecentJournalEntries(3);

      if (entries.length === 0) {
        return 'No recent journal entries found.';
      }

      const summaryParts = entries.map((entry, index) => {
        const date = new Date(entry.entry_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        const preview = entry.entry_text.length > 100
          ? entry.entry_text.substring(0, 100) + '...'
          : entry.entry_text;
        return `${index + 1}. ${date}: "${preview}"`;
      });

      return `Recent reflections:\n${summaryParts.join('\n')}`;
    } catch (error) {
      console.error('Error in getJournalSummary:', error);
      return 'Unable to retrieve journal summary.';
    }
  }
}

export const journalService = new JournalService();
