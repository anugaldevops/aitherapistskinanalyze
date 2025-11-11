# Meditation Audio Files

This directory contains guided meditation audio files for the AI Therapist feature.

## Required Files

The application expects the following meditation audio files:

1. **inner_child.mp3** - Meeting Your Inner Child (4 min)
   - Visualization to connect with your younger self
   - Background: Soft piano + wind chimes

2. **breathwork_478.mp3** - Calming Breath Work (4-7-8) (3 min)
   - Breathing count guidance
   - Background: Ocean waves or ambient pads

3. **self_compassion.mp3** - Self-Compassion Journey (4 min)
   - Reflective prompts for self-kindness
   - Background: Light harp or synth bed

4. **grounding_54321.mp3** - 5-4-3-2-1 Grounding (3 min)
   - Sensory awareness grounding
   - Background: Forest or rain ambience

## Creating Audio Files

### Option 1: Use OpenAI Text-to-Speech API

You can generate these audio files programmatically using OpenAI's TTS API:

\`\`\`javascript
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateMeditation(script, outputFile) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: "alloy",  // Options: alloy, echo, fable, onyx, nova, shimmer
    input: script,
    speed: 0.9  // Slower, calming pace
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  fs.writeFileSync(outputFile, buffer);
}

// Generate each meditation using scripts from src/data/meditations.ts
\`\`\`

### Option 2: Manual Recording

1. Record narration using a calm, soothing voice
2. Use royalty-free background music from:
   - Pixabay Audio Library (https://pixabay.com/music/)
   - Bensound (https://www.bensound.com/)
   - Free Music Archive (https://freemusicarchive.org/)
3. Mix audio at 30-40% background music volume relative to narration
4. Export as MP3 files (128-192 kbps recommended)

### Option 3: Use Existing Meditation Audio

- Ensure you have proper licensing for any pre-recorded meditation audio
- Convert to MP3 format if needed
- Name files according to the convention above

## Audio Specifications

- Format: MP3
- Bitrate: 128-192 kbps recommended
- Sample Rate: 44.1 kHz
- Channels: Stereo
- Duration: 2-4 minutes each

## Background Music Sources (Royalty-Free)

- **Pixabay**: https://pixabay.com/music/
- **Bensound**: https://www.bensound.com/
- **Free Music Archive**: https://freemusicarchive.org/
- **YouTube Audio Library**: https://www.youtube.com/audiolibrary/music
- **Incompetech**: https://incompetech.com/music/royalty-free/

## Notes

- Background music should be subtle and non-distracting
- Narration should be clear and easy to understand
- Pacing should be slow and meditative
- Include pauses for reflection where indicated in scripts
- Test audio files before deployment to ensure quality
