# Quick Start: Meditation Audio (Using Your API Key)

## ✅ Audio Files Generated Successfully!

Your meditation audio files have been generated and are ready to use:
- ✓ `inner_child.mp3` (775 KB)
- ✓ `breathwork_478.mp3` (1.1 MB)
- ✓ `self_compassion.mp3` (893 KB)
- ✓ `grounding_54321.mp3` (904 KB)

## How to Test the Meditation Player

1. **Start your dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open your app** in a browser

3. **Click the AI Therapist button** (floating button in bottom-right corner)

4. **Try a meditation**:
   - Say: "I'd like to try a meditation"
   - Or type: "Can you guide me through a meditation?"

5. **Select any meditation** from the list

6. **Click the Play button** - Audio should now play!

## Features Available

- ✅ Play/Pause controls
- ✅ Progress slider (seek through meditation)
- ✅ Volume control with mute button
- ✅ Restart button to replay from beginning
- ✅ Meditation completion tracking
- ✅ Beautiful visualization with gradients

## Voice Details

- **Voice**: Google Neural2-F (calm, soothing female voice)
- **Speed**: 0.85x (slower, meditative pace)
- **Pitch**: -2.0 (slightly lower, calming)
- **Quality**: High-quality Neural2 voice from Google Cloud

## If You Need to Regenerate

If you ever need to regenerate the audio files:

```bash
node generate-meditations-google-apikey.js
```

Your API key is already embedded in the script, so it will just work!

## Cost

Using the Google Cloud API key you provided:
- Voice: Neural2 (premium quality)
- Total characters: ~4,000
- Cost: < $0.10 USD

## Customization

To change the voice or settings, edit `generate-meditations-google-apikey.js`:

```javascript
voice: {
  languageCode: 'en-US',
  name: 'en-US-Neural2-F',  // Change voice here
  ssmlGender: 'FEMALE'       // Or 'MALE'
}

audioConfig: {
  speakingRate: 0.85,  // 0.25-4.0 (adjust speed)
  pitch: -2.0,          // -20 to +20 (adjust pitch)
  volumeGainDb: 0.0     // -96 to +16 (adjust volume)
}
```

### Available Voices

Premium Neural2 voices:
- `en-US-Neural2-A` - Male
- `en-US-Neural2-C` - Female (energetic)
- `en-US-Neural2-F` - Female (calm) **← Current**
- `en-US-Neural2-G` - Female (warm)
- `en-US-Neural2-H` - Female (clear)
- `en-US-Neural2-I` - Male (warm)
- `en-US-Neural2-J` - Male (authoritative)

## What's Next?

Your meditation feature is now fully functional! Users can:

1. Ask the AI Therapist for meditation guidance
2. Choose from 4 different meditation types:
   - 🧸 Inner Child work (visualization)
   - 🌬️ Breathwork 4-7-8 (breathing exercise)
   - 💝 Self-Compassion (reflection)
   - 🌟 5-4-3-2-1 Grounding (sensory awareness)
3. Listen to professionally-generated guided meditations
4. Track their progress and completion

The meditation player will automatically track when users complete meditations and save their progress to the database!

## Troubleshooting

### Audio doesn't play
- Check browser console for errors
- Verify files exist: `ls public/audio/meditations/`
- Clear browser cache
- Try a different browser

### Audio is too quiet
Edit the script and increase `volumeGainDb`:
```javascript
volumeGainDb: 6.0  // Increase from 0.0
```
Then regenerate: `node generate-meditations-google-apikey.js`

### Want different pacing
Edit `speakingRate`:
```javascript
speakingRate: 0.90  // Slightly faster than current 0.85
```

## Enjoy!

Your holistic wellness platform now has fully functional guided meditation audio! 🧘‍♀️✨
