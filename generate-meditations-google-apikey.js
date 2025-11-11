#!/usr/bin/env node

/**
 * Script to generate meditation audio files using Google Cloud Text-to-Speech with API Key
 *
 * Prerequisites:
 * 1. Run: npm install node-fetch
 * 2. Set your API key: export GOOGLE_CLOUD_API_KEY="your-api-key"
 * 3. Run: node generate-meditations-google-apikey.js
 *
 * This will generate MP3 files in public/audio/meditations/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your API key
const API_KEY = process.env.GOOGLE_CLOUD_API_KEY || 'AIzaSyCL3I1BIpRSq-xP815iCasRfh9bjyta6uw';
const TTS_ENDPOINT = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

const meditations = [
  {
    filename: 'cooling_breath_478.mp3',
    script: `Find a comfortable position and let your body settle. Place one hand on your belly.

The 4-7-8 breath is a cooling technique that calms your nervous system. We'll do several cycles together, as many as you need.

First, exhale completely through your mouth with a gentle whoosh sound. Release everything.

Now, close your mouth and inhale quietly through your nose for 4 counts. One... two... three... four. Feel the coolness.

Hold your breath gently for 7 counts. One... two... three... four... five... six... seven.

Exhale slowly through your mouth for 8 counts. One... two... three... four... five... six... seven... eight. Feel any heat leaving your body.

That's one cycle. Let's continue...

Inhale through your nose for 4... two... three... four. Cool air in.
Hold for 7... two... three... four... five... six... seven.
Exhale for 8... two... three... four... five... six... seven... eight. Heat releasing.

Good. Keep going at your own pace...

Inhale for 4... two... three... four.
Hold for 7... two... three... four... five... six... seven.
Exhale for 8... two... three... four... five... six... seven... eight.

One more cycle...

Inhale for 4... two... three... four.
Hold for 7... two... three... four... five... six... seven.
Exhale for 8... two... three... four... five... six... seven... eight.

Beautiful. Now return to your natural breath. Notice how you feel... perhaps cooler, calmer, more centered.

You can use this technique anytime day or night. Four breaths is all it takes.`
  },
  {
    filename: 'safe_place.mp3',
    script: `Close your eyes and take three deep breaths. Let your body relax with each exhale.

Now, imagine a place where you feel completely safe and at peace. This could be somewhere real or imaginary... a room, a garden, a beach, a forest clearing. Anywhere you feel protected and calm.

Take a moment to notice the details of this place. What do you see around you? What colors, shapes, textures?

What do you hear? Maybe gentle sounds of nature, or peaceful silence. Just notice.

What can you feel? The ground beneath you, the air on your skin, the temperature... comfortable and just right.

What can you smell? Fresh air, flowers, the ocean... something that brings you peace.

This is your Safe Place. No one can enter without your permission. Nothing can harm you here. You are completely protected.

Notice how your body feels in this place. Your shoulders might soften. Your breathing might slow. Your jaw might unclench.

You can come here anytime you need to. When anxiety spikes. When emotions overwhelm. When the world feels too much. This place is always here, always waiting, always safe.

Place your hand on your heart and say to yourself: "I am safe. I am protected. I can return here whenever I need."

Take one more deep breath in this place...

And when you're ready, slowly return to the present moment. Wiggle your fingers and toes. Know that you can return to your Safe Place anytime, simply by closing your eyes and remembering.`
  },
  {
    filename: 'progressive_relax.mp3',
    script: `Lie down or sit comfortably. Take three slow, deep breaths... releasing tension with each exhale.

We're going to relax your body from head to toe. Just notice each area as I guide you. No effort needed.

Bring your attention to your forehead and scalp. Let any tension there soften and release... smoothing out.

Your eyes and temples... letting go of any tightness. Your jaw unclenching, teeth slightly apart. Your whole face softening.

Your neck and shoulders... often where we hold so much stress. Let them drop and release. Feeling heavier, more relaxed.

Your upper back and chest... softening with each breath. Your lungs expanding and contracting naturally.

Your arms, from shoulders to fingertips... letting them rest completely. No need to hold or grip anything. Just releasing.

Your belly and lower back... softening, letting go of any holding or tightness. Breathing naturally into this space.

Your hips and pelvis... releasing any tension. Feeling supported by whatever's beneath you.

Your thighs and knees... heavy and relaxed. No effort needed.

Your calves and ankles... letting go completely. Feeling the relaxation spreading.

Your feet and toes... the very last part. Completely relaxed. Released.

Now scan your whole body from head to toe. If you notice any remaining tension, breathe into that area and let it soften.

Your body knows how to rest. Your body knows how to heal. Trust this process.

Stay here for as long as you need... and when you're ready, slowly begin to move, carrying this relaxation with you into sleep or into your day.`
  },
  {
    filename: 'inner_child.mp3',
    script: `Take a comfortable seat and gently close your eyes. Take three deep, slow breaths... In through your nose... and out through your mouth.

Imagine yourself in a safe, peaceful place. It could be a warm room, a garden, or anywhere you feel completely secure. Notice the details around you... the light, the colors, the feeling of safety.

In this safe space, you notice a younger version of yourself approaching. What age are they? What are they wearing? Just observe them with curiosity and warmth.

Greet your inner child with love. Notice how they feel. Are they happy? Sad? Scared? Just observe without judgment. Let them know it's okay to feel whatever they're feeling.

Ask your inner child gently: "What do you need from me right now?" Listen quietly... There's no rush. Just be present with whatever comes up.

Now, tell your inner child with all the love in your heart: "I see you. I hear you. You are safe with me. I will take care of you. You are loved."

Give your inner child a hug, or hold their hand. Feel the connection between you... the healing that happens when you acknowledge this part of yourself.

When you're ready, slowly return to the present moment. Wiggle your fingers and toes. Take a deep breath... and gently open your eyes.

You can return to this safe place and visit your inner child anytime you need comfort or healing.`
  },
  {
    filename: 'breathwork_478.mp3',
    script: `Welcome. Find a comfortable position, sitting or lying down. Place one hand on your belly, and the other on your chest.

The 4-7-8 breath is a powerful technique to calm your nervous system. We'll do four complete cycles together.

First, exhale completely through your mouth, making a whoosh sound. Empty your lungs.

Now, close your mouth and inhale quietly through your nose for 4 counts. One... two... three... four.

Hold your breath for 7 counts. One... two... three... four... five... six... seven.

Exhale completely through your mouth for 8 counts, making a whoosh sound. One... two... three... four... five... six... seven... eight.

That's one breath cycle. Let's continue...

Inhale through your nose for 4... two... three... four.
Hold for 7... two... three... four... five... six... seven.
Exhale for 8... two... three... four... five... six... seven... eight.

Good. Two more cycles...

Inhale for 4... two... three... four.
Hold for 7... two... three... four... five... six... seven.
Exhale for 8... two... three... four... five... six... seven... eight.

Last cycle...

Inhale for 4... two... three... four.
Hold for 7... two... three... four... five... six... seven.
Exhale for 8... two... three... four... five... six... seven... eight.

Beautiful. Now return to your natural breath. Notice how you feel... perhaps calmer, more centered, more present.

You can use this technique anytime you feel anxious or stressed. Four breaths is all it takes.`
  },
  {
    filename: 'self_compassion.mp3',
    script: `Settle into a comfortable position. Close your eyes if that feels right. Take a deep breath in... and let it go.

Think about how you would treat a dear friend who was struggling. Would you be harsh and critical? Or would you be kind, understanding, and supportive?

Now think about how you treat yourself when you're struggling. Often, we're our own harshest critics. Today, we're going to practice treating ourselves with the same kindness we'd give to a friend.

Bring to mind something you've been criticizing yourself about lately. Maybe it's a mistake you made, something you regret, or a way you feel you're not good enough.

Notice the feelings that come up... Perhaps shame, sadness, or frustration. Just acknowledge these feelings without judgment.

Now, place your hand on your heart. Feel the warmth of your hand. This is a gesture of self-compassion.

Speak to yourself as you would to someone you love: "This is really hard. What I'm feeling makes sense. I'm doing the best I can with what I know right now."

Remember: You are human. Being imperfect, making mistakes, struggling... this is part of the shared human experience. You are not alone in this.

What would you say to a friend in your situation? What words of comfort would you offer? Now, offer those same words to yourself.

Take a moment to think: What does my inner child need to hear right now? Maybe it's "You are enough." Or "You are worthy of love." Or "I'm proud of you for trying."

Breathe in self-compassion... Breathe out self-criticism.

When you're ready, slowly open your eyes. Carry this kindness with you today.`
  },
  {
    filename: 'grounding_54321.mp3',
    script: `This is the 5-4-3-2-1 grounding technique. It helps when you feel anxious, overwhelmed, or disconnected. Let's anchor you in the present moment using your five senses.

Keep your eyes open for this one. Take a deep breath... and let's begin.

First: Look around and name 5 things you can see. Really look at them. Notice their colors, shapes, textures. Take your time...

One... Two... Three... Four... Five. Good.

Now: Identify 4 things you can touch or feel. Maybe it's the ground beneath your feet, the chair supporting you, the texture of your clothing, or the air on your skin.

One... Two... Three... Four. Notice each sensation.

Next: Listen carefully and identify 3 things you can hear. Perhaps birds, the hum of electronics, distant traffic, your own breath. Even subtle sounds count.

One... Two... Three. Just listening.

Now: Notice 2 things you can smell. If you can't smell anything right now, think of your two favorite scents. What brings you comfort? What makes you feel at home?

One... Two.

Finally: Identify 1 thing you can taste. Or, think about your favorite taste. Something that brings you joy or comfort.

Take a deep breath. Notice how you feel more present, more grounded, more here. Your anxiety may have softened. Your mind may feel clearer.

You can return to this exercise anytime, anywhere. 5-4-3-2-1. Your anchor to the present moment.`
  }
];

async function generateMeditation(meditation) {
  console.log(`\nGenerating ${meditation.filename}...`);

  try {
    const requestBody = {
      input: {
        text: meditation.script
      },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-F',
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.85,
        pitch: -2.0,
        volumeGainDb: 0.0,
        effectsProfileId: ['headphone-class-device']
      }
    };

    const response = await fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.audioContent) {
      throw new Error('No audio content in response');
    }

    // Decode base64 audio content
    const audioBuffer = Buffer.from(data.audioContent, 'base64');

    // Write to file
    const outputDir = path.join(__dirname, 'public', 'audio', 'meditations');
    const outputPath = path.join(outputDir, meditation.filename);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, audioBuffer);
    console.log(`✓ Generated ${meditation.filename} (${(audioBuffer.length / 1024).toFixed(2)} KB)`);
  } catch (error) {
    console.error(`✗ Error generating ${meditation.filename}:`, error.message);
  }
}

async function main() {
  console.log('Starting meditation audio generation with Google Cloud TTS...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  console.log('Voice: en-US-Neural2-F (calm, soothing female voice)');
  console.log('Speed: 0.85x (meditative pace)');
  console.log(`Total meditations to generate: ${meditations.length}`);
  console.log('This will take a few minutes...\n');

  for (const meditation of meditations) {
    await generateMeditation(meditation);
    // Add delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✓ All meditation audio files generated successfully!');
  console.log('Files saved to: public/audio/meditations/');
  console.log('\nRestart your dev server to load the new audio files.');
}

main().catch(console.error);
