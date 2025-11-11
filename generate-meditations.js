#!/usr/bin/env node

/**
 * Script to generate meditation audio files using OpenAI Text-to-Speech
 *
 * Prerequisites:
 * 1. Set your OpenAI API key: export OPENAI_API_KEY="your-key-here"
 * 2. Run: node generate-meditations.js
 *
 * This will generate MP3 files in public/audio/meditations/
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const meditations = [
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
    const mp3 = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "alloy",
      input: meditation.script,
      speed: 0.85
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const outputDir = path.join(__dirname, 'public', 'audio', 'meditations');
    const outputPath = path.join(outputDir, meditation.filename);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ Generated ${meditation.filename}`);
  } catch (error) {
    console.error(`✗ Error generating ${meditation.filename}:`, error.message);
  }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is not set.');
    console.error('Please set it with: export OPENAI_API_KEY="your-key-here"');
    process.exit(1);
  }

  console.log('Starting meditation audio generation...');
  console.log('This will take a few minutes...\n');

  for (const meditation of meditations) {
    await generateMeditation(meditation);
  }

  console.log('\n✓ All meditation audio files generated successfully!');
  console.log('Files saved to: public/audio/meditations/');
}

main().catch(console.error);
