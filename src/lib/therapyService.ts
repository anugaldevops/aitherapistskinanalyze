import { supabase } from './supabase';
import OpenAI from 'openai';
import {
  THERAPIST_SYSTEM_PROMPT,
  CRISIS_KEYWORDS,
  INNER_CHILD_TRIGGERS,
  THERAPIST_PERSONAS,
  EMOTIONAL_KEYWORDS,
  BEHAVIORAL_KEYWORDS,
  REFUSAL_KEYWORDS,
  MENOPAUSE_KEYWORDS
} from './constants';
import { getLatestAnalysis } from './demoData';
import { ShortReplyUtility } from './shortReplyUtility';
import { ParaphraseGenerator } from './paraphraseGenerator';
import { CognitiveDistortionDetector, DetectedDistortion } from './cognitiveDistortionDetector';
import { ResponseDiversityTracker } from './responseDiversityTracker';
import { EmotionalIntelligence, EmotionalContext } from './emotionalIntelligence';
import { journalService } from './journalService';
import { skinImprovementService } from './skinImprovementAnalysis';
import { contextEnrichmentService } from './contextEnrichment';
import { historicalDataService } from './historicalDataService';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface TherapyMessage {
  role: 'user' | 'therapist';
  content: string;
  timestamp: string;
}

export interface TherapySession {
  id: string;
  user_id: string;
  session_start_time: string;
  session_end_time: string | null;
  conversation_log: TherapyMessage[];
  mood_mentioned: string[];
  actions_triggered: Array<{ action: string; timestamp: string }>;
  created_at: string;
  updated_at: string;
}

export interface VoiceCommand {
  intent: string;
  confidence: number;
  parameters?: Record<string, any>;
}

export class TherapyService {
  private currentSessionId: string | null = null;
  private conversationHistory: TherapyMessage[] = [];
  private currentMode: 'voice' | 'text' = 'text';
  private skincareSuppressed: boolean = false;
  private turnCount: number = 0;
  private maxTurnsReached: boolean = false;
  private lastParaphraseUsed: boolean = false;
  private lastProbeUsed: boolean = false;
  private lastEmotionCheck: string | null = null;
  private sessionPhase: string = 'opening';
  private diversityTracker: ResponseDiversityTracker = new ResponseDiversityTracker();
  private lastEmotionalContext: EmotionalContext | null = null;
  private sessionMode: 'general' | 'menopause' = 'general';

  async createSession(mode: 'voice' | 'text' = 'text'): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      this.currentMode = mode;

      const { data, error } = await supabase
        .from('therapy_sessions')
        .insert({
          user_id: user.id,
          conversation_log: [],
          mood_mentioned: [],
          actions_triggered: [],
          interaction_mode: mode
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating therapy session:', error);
        return null;
      }

      this.currentSessionId = data.id;
      this.conversationHistory = [];
      this.sessionMode = 'general';
      return data.id;
    } catch (error) {
      console.error('Error creating therapy session:', error);
      return null;
    }
  }

  updateMode(mode: 'voice' | 'text'): void {
    if (this.currentMode !== mode) {
      this.currentMode = mode;
      if (this.currentSessionId) {
        supabase
          .from('therapy_sessions')
          .update({ interaction_mode: 'mixed' })
          .eq('id', this.currentSessionId)
          .then(() => {
            console.log('Session mode updated to mixed');
          });
      }
    }
  }

  async getTherapistPreference(): Promise<'voice' | 'text'> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'text';

      const { data, error } = await supabase
        .from('user_profiles')
        .select('therapist_mode_preference')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        return 'text';
      }

      return data.therapist_mode_preference || 'text';
    } catch (error) {
      console.error('Error getting therapist preference:', error);
      return 'text';
    }
  }

  async setTherapistPreference(mode: 'voice' | 'text'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_profiles')
        .update({ therapist_mode_preference: mode })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error setting therapist preference:', error);
    }
  }

  async addMessage(role: 'user' | 'therapist', content: string): Promise<void> {
    const message: TherapyMessage = {
      role,
      content,
      timestamp: new Date().toISOString()
    };

    this.conversationHistory.push(message);

    if (role === 'user') {
      this.turnCount++;

      if (this.turnCount >= 3) {
        this.maxTurnsReached = true;
      }
    }

    if (this.currentSessionId) {
      const moods = this.extractMoods(content);

      const updates: any = {
        conversation_log: this.conversationHistory,
        turn_count: this.turnCount,
        max_turns_reached: this.maxTurnsReached
      };

      if (moods.length > 0) {
        const { data: currentSession } = await supabase
          .from('therapy_sessions')
          .select('mood_mentioned')
          .eq('id', this.currentSessionId)
          .single();

        if (currentSession) {
          const existingMoods = currentSession.mood_mentioned || [];
          updates.mood_mentioned = [...new Set([...existingMoods, ...moods])];
        }
      }

      await supabase
        .from('therapy_sessions')
        .update(updates)
        .eq('id', this.currentSessionId);
    }
  }

  async endSession(): Promise<void> {
    if (this.currentSessionId) {
      await supabase
        .from('therapy_sessions')
        .update({
          session_end_time: new Date().toISOString()
        })
        .eq('id', this.currentSessionId);

      this.currentSessionId = null;
      this.conversationHistory = [];
      this.skincareSuppressed = false;
      this.turnCount = 0;
      this.maxTurnsReached = false;
      this.lastParaphraseUsed = false;
      this.lastProbeUsed = false;
      this.lastEmotionCheck = null;
      this.sessionPhase = 'opening';
      this.diversityTracker.reset();
      this.lastEmotionalContext = null;
      this.sessionMode = 'general';
    }
  }

  checkForMenopauseTopic(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return MENOPAUSE_KEYWORDS.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
  }

  setSessionMode(mode: 'general' | 'menopause'): void {
    this.sessionMode = mode;
    if (this.currentSessionId) {
      supabase
        .from('therapy_sessions')
        .update({ menopause_mode: mode === 'menopause' })
        .eq('id', this.currentSessionId)
        .then(() => {
          console.log(`Session mode updated to ${mode}`);
        });
    }
  }

  getSessionMode(): 'general' | 'menopause' {
    return this.sessionMode;
  }

  async logIntent(intent: string): Promise<void> {
    console.log(`[Intent Logged]: ${intent} at ${new Date().toISOString()}`);
    await this.logAction(intent);

    if (intent === 'crisis_detected') {
      await this.markCrisisDetected();
    }

    if (intent === 'inner_child_theme_detected') {
      await this.incrementInnerChildWork();
    }
  }

  async markCrisisDetected(): Promise<void> {
    if (this.currentSessionId) {
      await supabase
        .from('therapy_sessions')
        .update({ crisis_detected: true })
        .eq('id', this.currentSessionId);
    }
  }

  async incrementInnerChildWork(): Promise<void> {
    if (this.currentSessionId) {
      const { data: currentSession } = await supabase
        .from('therapy_sessions')
        .select('inner_child_work_count')
        .eq('id', this.currentSessionId)
        .single();

      if (currentSession) {
        const count = (currentSession.inner_child_work_count || 0) + 1;
        await supabase
          .from('therapy_sessions')
          .update({ inner_child_work_count: count })
          .eq('id', this.currentSessionId);
      }
    }
  }

  async trackTherapeuticModality(modality: string): Promise<void> {
    if (this.currentSessionId) {
      const { data: currentSession } = await supabase
        .from('therapy_sessions')
        .select('therapeutic_modalities_used')
        .eq('id', this.currentSessionId)
        .single();

      if (currentSession) {
        const modalities = currentSession.therapeutic_modalities_used || [];
        if (!modalities.includes(modality)) {
          modalities.push(modality);
          await supabase
            .from('therapy_sessions')
            .update({ therapeutic_modalities_used: modalities })
            .eq('id', this.currentSessionId);
        }
      }
    }
  }

  async logAction(action: string): Promise<void> {
    if (this.currentSessionId) {
      const { data: currentSession } = await supabase
        .from('therapy_sessions')
        .select('actions_triggered')
        .eq('id', this.currentSessionId)
        .single();

      if (currentSession) {
        const actions = currentSession.actions_triggered || [];
        actions.push({
          action,
          timestamp: new Date().toISOString()
        });

        await supabase
          .from('therapy_sessions')
          .update({
            actions_triggered: actions
          })
          .eq('id', this.currentSessionId);
      }
    }
  }

  parseVoiceCommand(transcript: string): VoiceCommand | null {
    const lowerTranscript = transcript.toLowerCase().trim();

    if (lowerTranscript.includes('start') && (lowerTranscript.includes('scan') || lowerTranscript.includes('analysis'))) {
      return { intent: 'start_scan', confidence: 0.9 };
    }

    if (lowerTranscript.includes('show') && lowerTranscript.includes('history')) {
      return { intent: 'show_history', confidence: 0.9 };
    }

    if (lowerTranscript.includes('view') && lowerTranscript.includes('routine')) {
      return { intent: 'view_routine', confidence: 0.9 };
    }

    if (lowerTranscript.includes('open') && lowerTranscript.includes('dashboard')) {
      return { intent: 'open_dashboard', confidence: 0.9 };
    }

    if (lowerTranscript.includes('help')) {
      return { intent: 'show_help', confidence: 0.8 };
    }

    return null;
  }

  checkForCrisisKeywords(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
  }

  checkForInnerChildThemes(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return INNER_CHILD_TRIGGERS.some(trigger => lowerMessage.includes(trigger));
  }

  getCrisisResponse(): string {
    return "CRISIS_ALERT";
  }

  private async detectIntent(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();

    if (REFUSAL_KEYWORDS.some(pattern => pattern.test(message))) {
      this.skincareSuppressed = true;
      await this.persistSkincareSuppression(true);
      return 'refusal';
    }

    if (MENOPAUSE_KEYWORDS.some(keyword => lowerMessage.includes(keyword.toLowerCase()))) {
      return 'menopause';
    }

    const travelKeywords = ['trip', 'travel', 'rishikesh', 'yoga', 'vacation', 'journey', 'visiting'];
    if (travelKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'travel';
    }

    if (lowerMessage.includes('listen') && (lowerMessage.includes('just') || lowerMessage.includes('someone to'))) {
      return 'listening_mode';
    }

    const stressKeywords = ['stress', 'stressed', 'anxious', 'anxiety', 'overwhelm', 'overwhelmed'];
    if (stressKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'stress';
    }

    const hasBehavioralContent = BEHAVIORAL_KEYWORDS.some(keyword =>
      lowerMessage.includes(keyword.toLowerCase())
    );
    if (hasBehavioralContent) {
      return 'behavioral';
    }

    const hasEmotionalContent = EMOTIONAL_KEYWORDS.some(keyword =>
      lowerMessage.includes(keyword.toLowerCase())
    );
    if (hasEmotionalContent) {
      return 'emotional';
    }

    const skincareKeywords = [
      'skin', 'acne', 'wrinkle', 'pore', 'complexion', 'moisturizer',
      'cleanser', 'routine', 'scan', 'analysis', 'face', 'aging'
    ];

    const hasSkincareContent = skincareKeywords.some(keyword => lowerMessage.includes(keyword));
    if (hasSkincareContent) {
      return 'skincare';
    }

    const progressKeywords = ['progress', 'improvement', 'better', 'improved', 'getting better', 'changes'];
    const hasProgressContent = progressKeywords.some(keyword => lowerMessage.includes(keyword));
    if (hasProgressContent && hasSkincareContent) {
      return 'skin_progress';
    }

    return 'general';
  }

  async generateTherapeuticResponse(userMessage: string, userName: string): Promise<string> {
    if (this.checkForCrisisKeywords(userMessage)) {
      await this.logIntent('crisis_detected');
      return this.getCrisisResponse();
    }

    if (this.checkForMenopauseTopic(userMessage) && this.sessionMode !== 'menopause') {
      this.setSessionMode('menopause');
      await this.logIntent('menopause_mode_activated');
    }

    const emotionalContext = EmotionalIntelligence.analyzeEmotionalContext(userMessage);
    this.lastEmotionalContext = emotionalContext;

    const emotionLabels = ParaphraseGenerator.extractUserEmotionLabels(userMessage);
    if (emotionLabels.length > 0) {
      await this.trackUserEmotionLabels(emotionLabels);
    }

    const distortions = CognitiveDistortionDetector.detectDistortions(userMessage);
    if (distortions.length > 0) {
      await this.trackCognitiveDistortion(distortions[0]);
    }

    const shouldUseProbe = CognitiveDistortionDetector.shouldUseProbe(
      this.turnCount,
      this.lastProbeUsed,
      distortions.length > 0
    );

    if (shouldUseProbe && distortions.length > 0) {
      this.lastProbeUsed = true;
      const probeResponse = distortions[0].probe;
      this.diversityTracker.trackPhrase(probeResponse);
      return ShortReplyUtility.formatShortReply(probeResponse);
    }

    this.lastProbeUsed = false;

    if (this.detectMultiPersonaRequest(userMessage)) {
      await this.logIntent('multi_persona_requested');
      await this.trackTherapeuticModality('MULTI_PERSONA');
      const perspectives = await this.generatePanelPerspectives(userMessage, userName);

      let response = `I'll share perspectives from our therapeutic panel:\n\n`;
      perspectives.forEach(({ persona, response: personaResponse }) => {
        response += `**${persona}**: ${personaResponse}\n\n`;
      });
      response += `These different viewpoints can help you explore this from multiple angles. What resonates with you?`;

      return response;
    }

    const intent = await this.detectIntent(userMessage);
    await this.logIntent(intent);

    if (this.suggestInnerChildExercise(userMessage)) {
      await this.logIntent('inner_child_theme_detected');
      await this.trackTherapeuticModality('INNER_CHILD');
    }

    if (intent === 'travel') {
      return await this.handleTravelIntent(userMessage, userName);
    }

    if (intent === 'listening_mode') {
      return await this.handleListeningModeIntent(userMessage, userName);
    }

    if (intent === 'stress') {
      return await this.handleStressIntent(userMessage, userName);
    }

    if (intent === 'behavioral') {
      return await this.handleBehavioralIntent(userMessage, userName);
    }

    if (intent === 'emotional') {
      return await this.handleEmotionalIntent(userMessage, userName);
    }

    if (intent === 'refusal') {
      return await this.handleRefusalIntent(userMessage, userName);
    }

    if (intent === 'menopause' || this.sessionMode === 'menopause') {
      return await this.handleMenopauseIntent(userMessage, userName);
    }

    if (intent === 'skin_progress') {
      return await this.handleSkinProgressIntent(userMessage, userName);
    }

    if (intent === 'skincare' && !this.skincareSuppressed) {
      return this.generateSkincareResponse(userMessage, userName);
    }

    if (intent === 'skincare' && this.skincareSuppressed) {
      return `We're focusing on your well-being right now, ${userName}. We can revisit skincare later. What's been most challenging for you lately?`;
    }

    return await this.generateGPTResponse(userMessage, userName);
  }

  private async handleSkinProgressIntent(_userMessage: string, _userName: string): Promise<string> {
    await this.trackTherapeuticModality('SKIN_PROGRESS_REVIEW');

    try {
      const improvement = await skinImprovementService.getImprovementAnalysis();

      if (!improvement || !improvement.hasHistory) {
        return 'You need at least two skin analyses to track your progress. Would you like to do another scan?';
      }

      const summary = await skinImprovementService.getProgressSummary();
      return summary;
    } catch (error) {
      console.error('Error handling skin progress intent:', error);
      return 'I had trouble accessing your skin analysis history. Would you like to try a new scan instead?';
    }
  }

  private async handleMenopauseIntent(userMessage: string, userName: string): Promise<string> {
    await this.trackTherapeuticModality('MENOPAUSE_SUPPORT');

    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('hot flash') || lowerMessage.includes('hot flashes')) {
      const responses = [
        `Hot flashes are intense. A 4-7-8 cooling breath can help calm your system. Want to try it together?`,
        `Those hot flashes must be exhausting. Quick breathing exercises often bring relief. Ready for one?`,
        `Hot flashes affect most women but respond well to cooling breath work. Shall we practice now?`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (lowerMessage.includes('night sweat') || lowerMessage.includes('insomnia') || lowerMessage.includes('sleep')) {
      const responses = [
        `Night sweats disrupt everything. Progressive relaxation before bed helps many people. Shall we try it?`,
        `Sleep troubles during menopause are rough. A Safe Place visualization might ease you into rest. Want to explore that?`,
        `Sleep disturbances are common but manageable with the right tools. Ready to learn a technique?`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (lowerMessage.includes('anxiety') || lowerMessage.includes('anxious') || lowerMessage.includes('panic') || lowerMessage.includes('mood swing')) {
      const responses = [
        `Menopause anxiety is real and valid. Creating a Safe Place you can return to helps when things spike. Ready?`,
        `That anxiety makes complete sense with all these changes. Grounding techniques can anchor you. Want to try one?`,
        `Mood changes are one of the toughest parts. Stress management can really help. What feels hardest right now?`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelm')) {
      const responses = [
        `Stress makes every menopause symptom worse. Let's work on calming your nervous system. Sound good?`,
        `Managing stress is key to easier menopause. What's your biggest stressor right now?`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (lowerMessage.includes('weight') || lowerMessage.includes('gain')) {
      const responses = [
        `Weight changes are frustrating but 20 minutes of daily movement makes a real difference. What activity feels doable?`,
        `Menopause shifts metabolism but small consistent habits help. What's one change you could make today?`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (lowerMessage.includes('attitude') || lowerMessage.includes('feel old') || lowerMessage.includes('aging')) {
      const responses = [
        `How you view this transition matters deeply. Some cultures see menopause as harvest time, not loss. What would shift for you?`,
        `Attitudes toward menopause affect symptom severity more than most realize. What belief about aging weighs on you?`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    return await this.generateGPTResponse(
      `${userMessage}\n\n[Therapist note: User experiencing menopause. Key facts: stress amplifies all symptoms; attitude toward aging/change impacts severity; hot flashes respond to cooling breath; sleep issues improve with relaxation; exercise (20min) reduces anxiety/depression; women who view menopause as "harvest time" vs "loss" have milder symptoms. Focus on stress management, empowerment, and practical tools. Keep to 2 sentences + 1 question.]`,
      userName
    );
  }

  private async handleBehavioralIntent(userMessage: string, userName: string): Promise<string> {
    await this.trackTherapeuticModality('BEHAVIORAL_SUPPORT');

    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('urge') || lowerMessage.includes('craving') || lowerMessage.includes('temptation')) {
      return await this.generateGPTResponse(
        `${userMessage}\n\n[Therapist note: User is experiencing urges/cravings. Offer grounding techniques, urge-surfing (riding the wave), and validate their courage in reaching out. Focus on CBT-based impulse control strategies.]`,
        userName
      );
    }

    if (lowerMessage.includes('addiction') || lowerMessage.includes('addicted') || lowerMessage.includes('can\'t stop')) {
      return await this.generateGPTResponse(
        `${userMessage}\n\n[Therapist note: User is discussing addiction or compulsive behavior. Provide non-judgmental support, acknowledge the difficulty, offer evidence-based techniques like ABC model (Activators, Beliefs, Consequences), and suggest breaking the cycle with small steps.]`,
        userName
      );
    }

    return await this.generateGPTResponse(
      `${userMessage}\n\n[Therapist note: User is discussing behavioral challenges. Validate their experience, offer compassionate support, and suggest practical coping strategies.]`,
      userName
    );
  }

  private async handleTravelIntent(userMessage: string, _userName: string): Promise<string> {
    await this.trackTherapeuticModality('TRAVEL_DISCUSSION');

    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('rishikesh')) {
      const responses = [
        `Rishikesh sounds beautiful—home of yoga and stillness. What draws you there this time?`,
        `Rishikesh, the capital of yoga! That's a meaningful journey. What are you hoping to find or experience there?`,
        `Traveling to Rishikesh—there's something sacred about that place. What part of the trip feels most important to you?`
      ];
      const selected = responses[Math.floor(Math.random() * responses.length)];
      this.diversityTracker.trackPhrase(selected);
      return selected;
    }

    if (lowerMessage.includes('yoga') || lowerMessage.includes('retreat')) {
      const responses = [
        `A yoga journey—that sounds rejuvenating. What are you seeking from this experience?`,
        `Yoga travel can be deeply transformative. What called you to this particular path?`
      ];
      const selected = responses[Math.floor(Math.random() * responses.length)];
      this.diversityTracker.trackPhrase(selected);
      return selected;
    }

    const responses = [
      `Travel can open us up in unexpected ways. What feels most meaningful about this journey for you?`,
      `That sounds like an important trip. What are you hoping to discover or experience?`
    ];
    const selected = responses[Math.floor(Math.random() * responses.length)];
    this.diversityTracker.trackPhrase(selected);
    return selected;
  }

  private async handleListeningModeIntent(_userMessage: string, userName: string): Promise<string> {
    await this.trackTherapeuticModality('LISTENING_PRESENCE');

    const responses = [
      `I'm here, fully present with you. Take your time—what needs to be said?`,
      `I'm listening, ${userName}. No rush. What's on your heart?`,
      `You have my full attention. Would you like quiet presence, or shall I offer a gentle reflection when you're ready?`,
      `I'm here to hold space for you. Share what feels right, in your own time.`
    ];

    const selected = responses[Math.floor(Math.random() * responses.length)];
    this.diversityTracker.trackPhrase(selected);
    return selected;
  }

  private async handleStressIntent(_userMessage: string, _userName: string): Promise<string> {
    await this.trackTherapeuticModality('STRESS_MANAGEMENT');

    const responses = [
      `Let's take a slow breath together before we unpack that. Ready for 4-7-8 breathing?`,
      `That stress sounds intense. Before we go deeper, would a brief grounding exercise help?`,
      `I hear the weight you're carrying. Want to try a calming breath first, or talk it through?`
    ];

    const selected = responses[Math.floor(Math.random() * responses.length)];
    this.diversityTracker.trackPhrase(selected);
    return selected;
  }

  private async handleEmotionalIntent(userMessage: string, userName: string): Promise<string> {
    await this.trackTherapeuticModality('EMOTIONAL_SUPPORT');
    return await this.generateGPTResponse(userMessage, userName);
  }

  private async handleRefusalIntent(_userMessage: string, userName: string): Promise<string> {
    const responses = [
      `No problem at all, ${userName}. We'll focus on what matters most to you right now. What's been on your mind lately?`,
      `That's completely fine, ${userName}. I'm here to support you with whatever you need. What would be most helpful for you today?`,
      `Absolutely, ${userName}. Let's talk about what's important to you. How have you been feeling?`,
      `I understand, ${userName}. We can revisit that another time. What would you like to explore or discuss right now?`,
      `Of course, ${userName}. Let's shift our focus to you. What's weighing on you today?`,
      `I hear you, ${userName}. We can set that aside. What feels most pressing right now?`,
      `Totally understood, ${userName}. What matters is what you need. Where would you like to start?`,
      `Makes sense, ${userName}. Let's pivot to what's important for you. What's on your heart?`
    ];

    const availableResponses = responses.filter(r => !this.diversityTracker.isOverused(r));
    const selected = availableResponses.length > 0
      ? availableResponses[Math.floor(Math.random() * availableResponses.length)]
      : responses[Math.floor(Math.random() * responses.length)];

    this.diversityTracker.trackPhrase(selected);
    return selected;
  }

  private async generateGPTResponse(userMessage: string, userName: string, requestedPersona?: string): Promise<string> {
    try {
      let systemPrompt = THERAPIST_SYSTEM_PROMPT.replace(/\{userName\}/g, userName);

      systemPrompt += `\n\nYou are speaking with ${userName}.`;

      systemPrompt += `\n\nIMPORTANT RESPONSE RULES:
- Keep responses to 2 sentences maximum
- Ask only ONE open-ended question per response
- Use warm, concise language
- Never diagnose or give opinions
- Mirror the user's own words and emotional vocabulary
- If user shows emotional distress, pause and do not introduce new topics`;

      if (this.lastEmotionalContext) {
        const empathyResponse = EmotionalIntelligence.determineEmpathyResponse(this.lastEmotionalContext);
        const contextEnhancement = EmotionalIntelligence.generateContextualPromptEnhancement(
          this.lastEmotionalContext,
          empathyResponse
        );
        systemPrompt += contextEnhancement;

        const emotionSpecificResponses = EmotionalIntelligence.getEmotionSpecificResponse(
          this.lastEmotionalContext.primaryEmotion,
          this.lastEmotionalContext.intensity
        );
        if (emotionSpecificResponses.length > 0) {
          systemPrompt += `\n\nConsider these emotion-specific responses: ${emotionSpecificResponses.join(', ')}`;
        }
      }

      const enrichedContext = await contextEnrichmentService.buildEnrichedContext({
        includeJournals: true,
        includeSkinAnalyses: true,
        includeTherapySessions: true,
        prioritizeEmotionalPatterns: true,
        prioritizeProgressIndicators: true,
        maxContextLength: 600
      });

      if (enrichedContext) {
        systemPrompt += enrichedContext.systemPromptAddition;

        if (enrichedContext.correlationNotes.length > 0 && this.turnCount <= 1) {
          systemPrompt += `\n\nKEY OBSERVATION: ${enrichedContext.correlationNotes[0]}. You may gently reference this if naturally relevant.`;
        }
      }

      const wellnessData = await this.getLatestWellnessData();
      if (wellnessData) {
        systemPrompt += `\n\nCurrent wellness snapshot: Clinical score ${wellnessData.clinicalScore} (${wellnessData.stressLevel} stress level).`;
      }

      const userTonePreference = await this.getUserTonePreference();
      if (userTonePreference) {
        systemPrompt += `\n\nUser's preferred therapeutic tone: ${userTonePreference}. Adapt your responses accordingly.`;
      }

      if (requestedPersona) {
        const persona = THERAPIST_PERSONAS[requestedPersona as keyof typeof THERAPIST_PERSONAS];
        if (persona) {
          systemPrompt += `\n\nFor this response, emphasize the perspective of the ${persona.name}, focusing on: ${persona.focus}. Use a ${persona.tone} tone.`;
        }
      }

      const conversationContext = this.conversationHistory.slice(-6).map(m => m.content);
      const paraphrase = ParaphraseGenerator.generateDynamicParaphrase(userMessage, conversationContext);

      const emotionalIntensity = this.lastEmotionalContext?.intensity === 'high' || this.lastEmotionalContext?.intensity === 'extreme' ? 'high' : undefined;
      const shouldUseParaphrase = ParaphraseGenerator.shouldUseParaphrase(
        this.turnCount,
        this.lastParaphraseUsed,
        emotionalIntensity
      );

      if (paraphrase && shouldUseParaphrase && !this.diversityTracker.isOverused(paraphrase)) {
        systemPrompt += `\n\nStart your response with this reflection: "${paraphrase}" Then add one supportive sentence and one open question.`;
        await this.trackParaphrase(paraphrase);
        this.diversityTracker.trackPhrase(paraphrase);
        this.lastParaphraseUsed = true;
      } else {
        this.lastParaphraseUsed = false;
      }

      const shouldAskEmotion = await this.shouldAskAboutEmotion();
      if (shouldAskEmotion) {
        systemPrompt += `\n\nAfter your reflection, ask: "What emotion is most present for you right now?"`;
        this.lastEmotionCheck = new Date().toISOString();
      }

      const dynamicTemperature = this.calculateDynamicTemperature();

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory.slice(-8).map(msg => ({
            role: msg.role === 'therapist' ? 'assistant' as const : 'user' as const,
            content: msg.content
          })),
          { role: 'user', content: userMessage }
        ],
        temperature: dynamicTemperature,
        max_tokens: 150
      });

      let rawResponse = completion.choices[0]?.message?.content || this.generateFallbackResponse(userMessage, userName);

      rawResponse = this.diversityTracker.enhanceResponse(rawResponse, userMessage);

      this.diversityTracker.trackPhrase(rawResponse);

      return ShortReplyUtility.formatShortReply(rawResponse);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateFallbackResponse(userMessage, userName);
    }
  }

  async getUserTonePreference(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('therapeutic_tone')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data.therapeutic_tone || null;
    } catch (error) {
      console.error('Error getting tone preference:', error);
      return null;
    }
  }

  async setUserTonePreference(tone: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_profiles')
        .update({ therapeutic_tone: tone })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error setting tone preference:', error);
    }
  }

  async generatePanelPerspectives(userMessage: string, userName: string): Promise<{ persona: string; response: string }[]> {
    const perspectives: { persona: string; response: string }[] = [];

    const selectedPersonas = [
      'PSYCHOANALYST',
      'INNER_CHILD_COACH',
      'CBT_EXPERT',
      'TRAUMA_COUNSELOR'
    ];

    for (const personaKey of selectedPersonas) {
      try {
        const response = await this.generateGPTResponse(userMessage, userName, personaKey);
        const persona = THERAPIST_PERSONAS[personaKey as keyof typeof THERAPIST_PERSONAS];
        perspectives.push({
          persona: persona.name,
          response
        });
      } catch (error) {
        console.error(`Error generating ${personaKey} perspective:`, error);
      }
    }

    return perspectives;
  }

  detectMultiPersonaRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const triggers = [
      'multiple perspectives',
      'different perspectives',
      'different viewpoints',
      'panel',
      'what would different therapists say',
      'various approaches',
      'different opinions',
      'all perspectives'
    ];
    return triggers.some(trigger => lowerMessage.includes(trigger));
  }

  suggestInnerChildExercise(message: string): boolean {
    return this.checkForInnerChildThemes(message);
  }

  private generateSkincareResponse(userMessage: string, userName: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('scan') || lowerMessage.includes('analysis')) {
      return `I can help you start a new skin scan, ${userName}. Would you like me to open the scanner for you?`;
    }

    if (lowerMessage.includes('routine')) {
      return `Let's check on your skincare routine, ${userName}. I can pull that up for you.`;
    }

    return `I'm here to support you with your skin health journey, ${userName}. Would you like to do a scan or review your routine?`;
  }

  private generateFallbackResponse(userMessage: string, _userName: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (this.checkForCrisisKeywords(userMessage)) {
      return this.getCrisisResponse();
    }

    const emotionalContext = EmotionalIntelligence.analyzeEmotionalContext(userMessage);

    if (emotionalContext.primaryEmotion !== 'neutral') {
      const emotionResponses = EmotionalIntelligence.getEmotionSpecificResponse(
        emotionalContext.primaryEmotion,
        emotionalContext.intensity
      );

      if (emotionResponses.length > 0) {
        const selected = emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
        this.diversityTracker.trackPhrase(selected);
        return selected;
      }
    }

    if (lowerMessage.includes('betrayed') || (lowerMessage.includes('boss') && lowerMessage.includes('asshole'))) {
      const betrayalResponses = [
        `Betrayal cuts deep, especially in the workplace. What hurts most about this situation?`,
        `That sounds like a painful breach of trust. What does this betrayal mean to you?`,
        `When someone in a position of power betrays us, it can shake our sense of safety. What do you need right now?`,
        `Professional betrayal is particularly complex. What boundary was crossed here?`,
        `That kind of hurt in the workplace can feel isolating. How are you holding up with this?`
      ];
      const selected = betrayalResponses[Math.floor(Math.random() * betrayalResponses.length)];
      this.diversityTracker.trackPhrase(selected);
      return selected;
    }

    if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('nervous')) {
      const anxietyResponses = [
        `Anxiety can be so consuming. What feels most threatening right now?`,
        `I hear the worry in your words. What would help you feel safer?`,
        `When anxiety shows up, it's often trying to protect something. What matters to you here?`,
        `That nervousness makes sense. What's the fear underneath it?`
      ];
      const selected = anxietyResponses[Math.floor(Math.random() * anxietyResponses.length)];
      this.diversityTracker.trackPhrase(selected);
      return selected;
    }

    if (lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed')) {
      const stressResponses = [
        `Overwhelm can be paralyzing. What feels like the heaviest piece right now?`,
        `That stress sounds intense. What would take even 10% of the pressure off?`,
        `When everything feels like too much, where does it help to start?`,
        `I can hear how much you're carrying. What's one thing you need right now?`
      ];
      const selected = stressResponses[Math.floor(Math.random() * stressResponses.length)];
      this.diversityTracker.trackPhrase(selected);
      return selected;
    }

    if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('depressed')) {
      const sadnessResponses = [
        `That sadness deserves space. What's beneath the heaviness?`,
        `I'm here with you in this. What does this sadness need from you?`,
        `Depression can make everything feel impossible. What's one small thing that might help?`,
        `Your pain is real. What would it mean to be gentle with yourself right now?`
      ];
      const selected = sadnessResponses[Math.floor(Math.random() * sadnessResponses.length)];
      this.diversityTracker.trackPhrase(selected);
      return selected;
    }

    const genericResponses = [
      `${this.diversityTracker.getDiverseOpening()}. What's most alive for you right now?`,
      `${this.diversityTracker.getDiverseEmpathy()} What do you need in this moment?`,
      `${this.diversityTracker.getDiverseTransition()}, you're navigating something significant. Tell me more?`,
      `I'm here, fully present with you. What feels most important to explore?`,
      `Your experience deserves attention. What part of this needs to be heard?`,
      `There's weight in what you're sharing. What would help right now?`
    ];

    const availableResponses = genericResponses.filter(r => !this.diversityTracker.isOverused(r));
    const selected = availableResponses.length > 0
      ? availableResponses[Math.floor(Math.random() * availableResponses.length)]
      : genericResponses[Math.floor(Math.random() * genericResponses.length)];

    this.diversityTracker.trackPhrase(selected);
    return selected;
  }

  isSkincareSuppressed(): boolean {
    return this.skincareSuppressed;
  }

  setSkincareSuppression(suppressed: boolean): void {
    this.skincareSuppressed = suppressed;
  }

  private async persistSkincareSuppression(suppressed: boolean): Promise<void> {
    if (this.currentSessionId) {
      await supabase
        .from('therapy_sessions')
        .update({ skincare_suppressed: suppressed })
        .eq('id', this.currentSessionId);
    }
  }

  async loadSessionState(): Promise<void> {
    if (this.currentSessionId) {
      const { data } = await supabase
        .from('therapy_sessions')
        .select('skincare_suppressed')
        .eq('id', this.currentSessionId)
        .single();

      if (data) {
        this.skincareSuppressed = data.skincare_suppressed || false;
      }
    }
  }

  async getLatestWellnessData(): Promise<{ clinicalScore: number; stressLevel: string } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const demoAnalysis = getLatestAnalysis();
        if (demoAnalysis) {
          return {
            clinicalScore: demoAnalysis.clinicalScore,
            stressLevel: demoAnalysis.clinicalScore > 12 ? 'high' : demoAnalysis.clinicalScore > 6 ? 'moderate' : 'low'
          };
        }
        return null;
      }

      const { data: analyses } = await supabase
        .from('analysis_history')
        .select('clinical_score')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })
        .limit(1);

      if (analyses && analyses.length > 0) {
        const clinicalScore = analyses[0].clinical_score;
        return {
          clinicalScore,
          stressLevel: clinicalScore > 12 ? 'high' : clinicalScore > 6 ? 'moderate' : 'low'
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching wellness data:', error);
      return null;
    }
  }

  getGreeting(userName: string): string {
    const latestAnalysis = getLatestAnalysis();

    if (latestAnalysis) {
      const { clinicalScore } = latestAnalysis;

      if (clinicalScore > 12) {
        return `Hello ${userName}, I'm your AI Therapist. I noticed some stress signals in your recent skin analysis. How are you feeling today?`;
      } else if (clinicalScore > 6) {
        return `Welcome ${userName}. Your recent analysis showed some mild tension patterns. Let's check in - how has your emotional state been?`;
      } else {
        return `Hi ${userName}. Your recent analysis looks positive! You've been maintaining good emotional balance. How are you feeling today?`;
      }
    }

    const greetings = [
      `Hello ${userName}, I'm your AI Therapist. How are you feeling today?`,
      `Welcome ${userName}. I'm here to listen and support you. How has your day been?`,
      `Hi ${userName}. It's good to see you. Tell me, what's on your mind today?`,
      `Good to have you here, ${userName}. Let's check in - how are you feeling right now?`
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private extractMoods(text: string): string[] {
    const moodKeywords = [
      'happy', 'sad', 'anxious', 'stressed', 'excited', 'worried',
      'calm', 'frustrated', 'tired', 'energetic', 'confident',
      'nervous', 'relaxed', 'angry', 'content', 'depressed',
      'overwhelmed', 'hopeful', 'disappointed'
    ];

    const lowerText = text.toLowerCase();
    const foundMoods = moodKeywords.filter(mood => lowerText.includes(mood));

    return foundMoods;
  }

  getConversationHistory(): TherapyMessage[] {
    return this.conversationHistory;
  }

  async getSessionStats(): Promise<{
    totalSessions: number;
    lastSessionDate: string | null;
    mostDiscussedMoods: string[];
    totalMessages: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          totalSessions: 0,
          lastSessionDate: null,
          mostDiscussedMoods: [],
          totalMessages: 0
        };
      }

      const { data: sessions, error } = await supabase
        .from('therapy_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('session_start_time', { ascending: false });

      if (error || !sessions) {
        return {
          totalSessions: 0,
          lastSessionDate: null,
          mostDiscussedMoods: [],
          totalMessages: 0
        };
      }

      const allMoods = sessions.flatMap(s => s.mood_mentioned || []);
      const moodCounts = allMoods.reduce((acc, mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostDiscussedMoods = Object.entries(moodCounts)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
        .map(([mood]) => mood);

      const totalMessages = sessions.reduce((sum, session) => {
        const log = session.conversation_log as unknown as TherapyMessage[];
        return sum + (Array.isArray(log) ? log.length : 0);
      }, 0);

      return {
        totalSessions: sessions.length,
        lastSessionDate: sessions.length > 0 ? sessions[0].session_start_time : null,
        mostDiscussedMoods,
        totalMessages
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        totalSessions: 0,
        lastSessionDate: null,
        mostDiscussedMoods: [],
        totalMessages: 0
      };
    }
  }

  async getLastSessionSummary(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: sessions } = await supabase
        .from('therapy_sessions')
        .select('conversation_log, mood_mentioned, session_start_time')
        .eq('user_id', user.id)
        .order('session_start_time', { ascending: false })
        .limit(2);

      if (!sessions || sessions.length < 2) return null;

      const lastSession = sessions[0];
      const moods = lastSession.mood_mentioned || [];

      if (moods.length > 0) {
        return `Last time we talked, you mentioned feeling ${moods.join(', ')}. How are you doing today?`;
      }

      return 'Welcome back! How have you been since we last talked?';
    } catch (error) {
      console.error('Error getting last session summary:', error);
      return null;
    }
  }

  async trackMeditationCompletion(meditationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('meditation_completions')
        .insert({
          user_id: user.id,
          session_id: this.currentSessionId,
          meditation_id: meditationId,
          meditation_title: this.getMeditationTitle(meditationId),
          completed: true,
          duration_listened: 0
        });

      if (error) {
        console.error('Error tracking meditation completion:', error);
        return;
      }

      if (this.currentSessionId) {
        const { data: currentSession } = await supabase
          .from('therapy_sessions')
          .select('completed_meditations')
          .eq('id', this.currentSessionId)
          .single();

        if (currentSession) {
          const meditations = currentSession.completed_meditations || [];
          if (!meditations.includes(meditationId)) {
            meditations.push(meditationId);
            await supabase
              .from('therapy_sessions')
              .update({ completed_meditations: meditations })
              .eq('id', this.currentSessionId);
          }
        }
      }

      await this.logAction(`meditation_completed:${meditationId}`);
    } catch (error) {
      console.error('Error tracking meditation completion:', error);
    }
  }

  private getMeditationTitle(meditationId: string): string {
    const titles: Record<string, string> = {
      'cooling-breath-478': '4-7-8 Cooling Breath',
      'safe-place': 'Safe Place',
      'progressive-relaxation': 'Progressive Relaxation',
      'inner-child': 'Meeting Your Inner Child',
      'breathwork-478': 'Calming Breath Work (4-7-8)',
      'self-compassion': 'Self-Compassion Journey',
      'grounding-54321': '5-4-3-2-1 Grounding'
    };
    return titles[meditationId] || meditationId;
  }

  async getMeditationStats(): Promise<{
    totalCompletions: number;
    completedMeditations: string[];
    lastMeditationDate: string | null;
    favoriteMeditation: string | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          totalCompletions: 0,
          completedMeditations: [],
          lastMeditationDate: null,
          favoriteMeditation: null
        };
      }

      const { data: completions, error } = await supabase
        .from('meditation_completions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error || !completions) {
        return {
          totalCompletions: 0,
          completedMeditations: [],
          lastMeditationDate: null,
          favoriteMeditation: null
        };
      }

      const meditationCounts = completions.reduce((acc, completion) => {
        acc[completion.meditation_id] = (acc[completion.meditation_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const favoriteMeditation = Object.entries(meditationCounts)
        .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || null;

      return {
        totalCompletions: completions.length,
        completedMeditations: [...new Set(completions.map(c => c.meditation_id))],
        lastMeditationDate: completions.length > 0 ? completions[0].completed_at : null,
        favoriteMeditation
      };
    } catch (error) {
      console.error('Error getting meditation stats:', error);
      return {
        totalCompletions: 0,
        completedMeditations: [],
        lastMeditationDate: null,
        favoriteMeditation: null
      };
    }
  }

  getTurnCount(): number {
    return this.turnCount;
  }

  hasMaxTurnsReached(): boolean {
    return this.maxTurnsReached;
  }

  resetTurnCount(): void {
    this.turnCount = 0;
    this.maxTurnsReached = false;
  }


  private async trackParaphrase(paraphrase: string): Promise<void> {
    if (!this.currentSessionId) return;

    const { data: currentSession } = await supabase
      .from('therapy_sessions')
      .select('paraphrases_used')
      .eq('id', this.currentSessionId)
      .single();

    if (currentSession) {
      const paraphrases = currentSession.paraphrases_used || [];
      paraphrases.push({
        text: paraphrase,
        timestamp: new Date().toISOString()
      });

      await supabase
        .from('therapy_sessions')
        .update({ paraphrases_used: paraphrases })
        .eq('id', this.currentSessionId);
    }
  }

  private async trackUserEmotionLabels(emotionLabels: string[]): Promise<void> {
    if (!this.currentSessionId) return;

    const { data: currentSession } = await supabase
      .from('therapy_sessions')
      .select('user_emotion_labels')
      .eq('id', this.currentSessionId)
      .single();

    if (currentSession) {
      const existing = currentSession.user_emotion_labels || [];
      const updated = [...new Set([...existing, ...emotionLabels])];

      await supabase
        .from('therapy_sessions')
        .update({ user_emotion_labels: updated })
        .eq('id', this.currentSessionId);
    }
  }

  private async trackCognitiveDistortion(distortion: DetectedDistortion): Promise<void> {
    if (!this.currentSessionId) return;

    const { data: currentSession } = await supabase
      .from('therapy_sessions')
      .select('cognitive_distortions_detected')
      .eq('id', this.currentSessionId)
      .single();

    if (currentSession) {
      const distortions = currentSession.cognitive_distortions_detected || [];
      distortions.push({
        type: distortion.type,
        pattern: distortion.pattern,
        timestamp: distortion.timestamp
      });

      await supabase
        .from('therapy_sessions')
        .update({ cognitive_distortions_detected: distortions })
        .eq('id', this.currentSessionId);
    }
  }

  private async shouldAskAboutEmotion(): Promise<boolean> {
    if (this.turnCount !== 1) {
      return false;
    }

    if (this.lastEmotionCheck) {
      return false;
    }

    return true;
  }

  async trackExerciseOffered(exerciseId: string): Promise<void> {
    if (!this.currentSessionId) return;

    const { data: currentSession } = await supabase
      .from('therapy_sessions')
      .select('exercises_offered')
      .eq('id', this.currentSessionId)
      .single();

    if (currentSession) {
      const exercises = currentSession.exercises_offered || [];
      exercises.push({
        exercise_id: exerciseId,
        offered_at: new Date().toISOString()
      });

      await supabase
        .from('therapy_sessions')
        .update({ exercises_offered: exercises })
        .eq('id', this.currentSessionId);
    }
  }

  async trackExerciseCompleted(exerciseId: string, reflection?: string): Promise<void> {
    if (!this.currentSessionId) return;

    const { data: currentSession } = await supabase
      .from('therapy_sessions')
      .select('exercises_completed')
      .eq('id', this.currentSessionId)
      .single();

    if (currentSession) {
      const exercises = currentSession.exercises_completed || [];
      exercises.push({
        exercise_id: exerciseId,
        completed_at: new Date().toISOString(),
        reflection: reflection || ''
      });

      await supabase
        .from('therapy_sessions')
        .update({ exercises_completed: exercises })
        .eq('id', this.currentSessionId);
    }
  }

  async updateSessionPhase(phase: string): Promise<void> {
    this.sessionPhase = phase;

    if (this.currentSessionId) {
      await supabase
        .from('therapy_sessions')
        .update({ session_phase: phase })
        .eq('id', this.currentSessionId);
    }
  }

  getSessionPhase(): string {
    return this.sessionPhase;
  }

  private calculateDynamicTemperature(): number {
    const baseTemperature = 0.85;

    if (this.turnCount === 0) {
      return 0.75;
    }

    if (this.lastEmotionalContext) {
      if (this.lastEmotionalContext.intensity === 'extreme' || this.lastEmotionalContext.intensity === 'high') {
        return 0.7;
      }

      if (this.lastEmotionalContext.complexity === 'complex') {
        return 0.9;
      }

      if (this.lastEmotionalContext.vulnerability === 'deeply_vulnerable') {
        return 0.75;
      }
    }

    if (this.turnCount >= 2) {
      return Math.min(0.95, baseTemperature + 0.1);
    }

    return baseTemperature;
  }

  getDiversityStats(): {
    totalPhrases: number;
    overusedPhrases: number;
    diversityScore: number;
  } {
    return this.diversityTracker.getStats();
  }

  async saveJournalEntry(prompt: string, entryText: string, exerciseId?: string): Promise<boolean> {
    try {
      const entry = await journalService.saveJournalEntry({
        prompt,
        entryText,
        therapySessionId: this.currentSessionId,
        exerciseId: exerciseId || 'mini-journal-prompt',
        moodAtTime: this.lastEmotionalContext?.primaryEmotion || ''
      });

      if (entry) {
        await this.logAction(`journal_entry_saved:${entry.id}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error saving journal entry:', error);
      return false;
    }
  }


  async getJournalStats() {
    return await journalService.getJournalStats();
  }

  async getSkinProgressSummary(): Promise<string> {
    try {
      return await skinImprovementService.getProgressSummary();
    } catch (error) {
      console.error('Error getting skin progress summary:', error);
      return 'Unable to retrieve skin progress data.';
    }
  }

  async getComprehensiveUserHistory(daysBack: number = 90) {
    try {
      const historicalContext = await historicalDataService.getUserHistoricalContext({
        daysBack,
        maxJournalEntries: 10,
        maxTherapySessions: 8,
        maxSkinAnalyses: 10,
        includeFullConversations: true,
        prioritizeRecent: true
      });

      if (!historicalContext) {
        return null;
      }

      const summary = await historicalDataService.generateContextSummary(historicalContext, 1000);

      return {
        context: historicalContext,
        summary,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting comprehensive user history:', error);
      return null;
    }
  }

  async analyzeUserProgress() {
    try {
      const enrichedContext = await contextEnrichmentService.buildEnrichedContext({
        includeJournals: true,
        includeSkinAnalyses: true,
        includeTherapySessions: true,
        prioritizeEmotionalPatterns: true,
        prioritizeProgressIndicators: true,
        maxContextLength: 800
      });

      if (!enrichedContext) {
        return {
          insights: [],
          patterns: [],
          recommendations: []
        };
      }

      return {
        insights: enrichedContext.recentInsights,
        patterns: enrichedContext.patternHighlights,
        correlations: enrichedContext.correlationNotes,
        journeySnapshot: enrichedContext.userJourneySnapshot
      };
    } catch (error) {
      console.error('Error analyzing user progress:', error);
      return {
        insights: [],
        patterns: [],
        recommendations: []
      };
    }
  }

  async generateLongitudinalAnalysis(userName: string): Promise<string> {
    try {
      const history = await this.getComprehensiveUserHistory(90);

      if (!history || !history.context) {
        return 'Insufficient data for longitudinal analysis. Continue using the app to build your history.';
      }

      const analysisPrompt = `Based on this user's 90-day history, provide a compassionate, insightful longitudinal analysis focusing on:
1. Emotional patterns and growth
2. Mind-body connections (stress/skin correlation)
3. Therapeutic progress and breakthroughs
4. Areas of continued focus

User History Summary:
${history.summary}

Provide a warm, supportive analysis in 3-4 paragraphs that celebrates progress and gently identifies areas for continued work.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a compassionate AI therapist analyzing ${userName}'s therapeutic journey. Provide insights that are encouraging, specific, and actionable.`
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      return completion.choices[0]?.message?.content || 'Unable to generate longitudinal analysis at this time.';
    } catch (error) {
      console.error('Error generating longitudinal analysis:', error);
      return 'Unable to generate analysis. Please try again later.';
    }
  }

  async getPatternInsights(): Promise<string[]> {
    try {
      const enrichedContext = await contextEnrichmentService.buildEnrichedContext({
        includeJournals: true,
        includeSkinAnalyses: true,
        includeTherapySessions: true,
        prioritizeEmotionalPatterns: true,
        prioritizeProgressIndicators: true,
        maxContextLength: 400
      });

      if (!enrichedContext) {
        return [];
      }

      const allInsights = [
        ...enrichedContext.patternHighlights,
        ...enrichedContext.correlationNotes
      ];

      return allInsights.slice(0, 5);
    } catch (error) {
      console.error('Error getting pattern insights:', error);
      return [];
    }
  }
}

export const therapyService = new TherapyService();
