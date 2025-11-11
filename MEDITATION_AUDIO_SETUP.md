# Meditation Audio Setup Guide

## Current Status

The meditation feature in the AI Therapist is fully functional, but the audio files are not yet generated. When users try to play a meditation, they will see a helpful message with the full meditation script they can read instead.

## Why Audio Files Are Missing

The meditation audio files require generation using Text-to-Speech (TTS) technology. These files are not included in the repository because:
1. They are large binary files (MP3s)
2. They can be easily generated using OpenAI's TTS API
3. This allows customization of voice, speed, and language

## How to Generate Meditation Audio Files

### Option 1: Using Google Cloud TTS API (Recommended - Has Free Tier!)

**Prerequisites:**
- Node.js installed
- Google Cloud account (free tier available)
- Google Cloud project with Text-to-Speech API enabled

**Quick Setup:**

1. Install the package:
   ```bash
   npm install @google-cloud/text-to-speech
   ```

2. Follow the complete setup guide in `GOOGLE_TTS_SETUP.md` for detailed instructions

3. Quick generate:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-key.json"
   npm run generate-meditations-google
   ```

**Benefits:**
- **FREE for Standard voices** (1M characters/month free tier)
- High quality Neural2 voices available (~$0.10 for these meditations)
- 400+ voices in 50+ languages
- No rate limits

**See `GOOGLE_TTS_SETUP.md` for detailed step-by-step instructions.**

### Option 2: Using OpenAI TTS API

**Prerequisites:**
- Node.js installed
- OpenAI API key (get one at https://platform.openai.com/api-keys)
- OpenAI account with credits (TTS costs ~$0.015 per 1,000 characters)

**Steps:**

1. Set your OpenAI API key as an environment variable:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

2. Run the generation script:
   ```bash
   npm run generate-meditations
   ```

3. This will create 4 MP3 files in `public/audio/meditations/`:
   - `inner_child.mp3` (4 min)
   - `breathwork_478.mp3` (3 min)
   - `self_compassion.mp3` (4 min)
   - `grounding_54321.mp3` (3 min)

4. Restart your dev server to load the new audio files

**Cost Estimate:**
- Total characters: ~4,000
- Estimated cost: ~$0.06 USD
- Model used: `tts-1-hd` (high quality)
- Voice: `alloy` (calm, neutral)
- Speed: 0.85x (slower, meditative pace)

### Option 3: Use Pre-recorded Meditation Audio

If you have existing meditation audio files:

1. Convert them to MP3 format (128-192 kbps recommended)
2. Rename them according to the expected filenames:
   - `inner_child.mp3`
   - `breathwork_478.mp3`
   - `self_compassion.mp3`
   - `grounding_54321.mp3`
3. Place them in `public/audio/meditations/`

**Important:** Ensure you have proper licensing rights for any pre-recorded audio you use.

### Option 3: Record Your Own

1. Use recording software (Audacity, GarageBand, etc.)
2. Read the meditation scripts from `src/data/meditations.ts`
3. Speak slowly and calmly (0.85x normal speaking pace)
4. Optional: Add subtle background music (30-40% volume)
5. Export as MP3 files with the correct names
6. Place in `public/audio/meditations/`

## Current User Experience (Without Audio)

When meditation audio files are missing, users will:
1. See a clear message: "Audio File Not Available"
2. Get an explanation that files haven't been generated
3. Have access to the full meditation script to read instead
4. Still be able to complete meditations (marked as completed when they close the player)

This graceful fallback ensures the app remains functional even without generated audio.

## Testing After Generation

1. Open the AI Therapist (floating button in bottom-right)
2. Say or type "I'd like to try a meditation"
3. Select any meditation from the list
4. Click the play button
5. Audio should start playing with full player controls

## Customization Options

You can customize the generated audio by editing `generate-meditations.js`:

- **Voice options:** `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`
- **Speed:** `0.85` (current) to `1.0` (normal pace)
- **Model:** `tts-1` (faster, cheaper) or `tts-1-hd` (higher quality)

Example:
```javascript
const mp3 = await openai.audio.speech.create({
  model: "tts-1-hd",
  voice: "nova",      // Change voice
  input: meditation.script,
  speed: 0.90         // Adjust speed
});
```

## Troubleshooting

### "OPENAI_API_KEY is not set"
- Make sure you exported the environment variable
- Check spelling: `export OPENAI_API_KEY="sk-..."`

### "Insufficient quota"
- Add credits to your OpenAI account
- Check your usage at https://platform.openai.com/usage

### "Audio plays but no sound"
- Check your system volume
- Check the volume slider in the meditation player
- Make sure the mute button isn't active

### "Error loading audio file"
- Verify files are in `public/audio/meditations/`
- Check file permissions (readable by web server)
- Clear browser cache and refresh

## Future Enhancements

Potential improvements to the meditation audio system:

1. **Background Music**: Add royalty-free ambient music tracks
2. **Multiple Languages**: Generate meditations in different languages
3. **Voice Selection**: Let users choose their preferred TTS voice
4. **Custom Meditations**: Allow users to create custom meditation scripts
5. **Offline Mode**: Cache audio files for offline use
6. **Progress Saving**: Track which meditations users have completed

## Resources

- **OpenAI TTS Documentation**: https://platform.openai.com/docs/guides/text-to-speech
- **Royalty-Free Music**: Listed in `public/audio/meditations/README.md`
- **Meditation Scripts**: See `src/data/meditations.ts` for full scripts

## Support

If you encounter issues generating or playing meditation audio, please check:
1. Browser console for detailed error messages
2. Network tab to see if audio files are being requested
3. File permissions in the `public/audio/meditations/` directory

For additional help, refer to the error messages shown in the meditation player UI.
