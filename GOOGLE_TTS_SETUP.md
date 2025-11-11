# Google Cloud Text-to-Speech Setup Guide

This guide will help you generate meditation audio files using Google Cloud Text-to-Speech API.

## Why Use Google Cloud TTS?

- **Cost-effective**: ~$0.10 for all 4 meditations (vs OpenAI's ~$0.06)
- **High quality**: Neural2 voices sound very natural
- **Free tier**: First 1 million characters per month free (Standard voices)
- **More voice options**: 400+ voices in 50+ languages
- **Better for longer audio**: No rate limits for generation

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "meditation-audio")
4. Click "Create"

### 2. Enable the Text-to-Speech API

1. In your project, go to [APIs & Services](https://console.cloud.google.com/apis/library)
2. Search for "Cloud Text-to-Speech API"
3. Click on it and press "Enable"
4. Wait for it to enable (takes ~30 seconds)

### 3. Create a Service Account

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click "Create Service Account"
3. Enter details:
   - **Name**: `meditation-audio-generator`
   - **Description**: `Service account for generating meditation audio files`
4. Click "Create and Continue"
5. Grant role: Select "Basic" → "Editor" (or use "Cloud Text-to-Speech Client")
6. Click "Continue" → "Done"

### 4. Create and Download Key

1. Find your new service account in the list
2. Click the three dots (⋮) → "Manage keys"
3. Click "Add Key" → "Create new key"
4. Choose **JSON** format
5. Click "Create"
6. A JSON file will download automatically
7. **Keep this file safe!** It contains credentials

### 5. Install Google Cloud TTS Package

```bash
npm install @google-cloud/text-to-speech
```

### 6. Set Up Credentials

Move your downloaded JSON key file to a secure location and set the environment variable:

**On Linux/Mac:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-key.json"
```

**On Windows (PowerShell):**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your-key.json"
```

**On Windows (Command Prompt):**
```cmd
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your-key.json
```

### 7. Generate Meditation Audio

```bash
npm run generate-meditations-google
```

This will create 4 MP3 files in `public/audio/meditations/`:
- `inner_child.mp3` (4 min)
- `breathwork_478.mp3` (3 min)
- `self_compassion.mp3` (4 min)
- `grounding_54321.mp3` (3 min)

### 8. Verify Files Were Created

```bash
ls -lh public/audio/meditations/
```

You should see 4 MP3 files, each around 1-2 MB.

### 9. Restart Dev Server

If your dev server is running, restart it to load the new audio files:
```bash
npm run dev
```

## Voice Options

The default voice is `en-US-Neural2-F` (calm, soothing female voice). You can change it in `generate-meditations-google.js`:

### Available Voices

**Neural2 Voices (High Quality):**
- `en-US-Neural2-A` - Male
- `en-US-Neural2-C` - Female (energetic)
- `en-US-Neural2-D` - Male (deep)
- `en-US-Neural2-E` - Female (youthful)
- `en-US-Neural2-F` - Female (calm) **← Current default**
- `en-US-Neural2-G` - Female (warm)
- `en-US-Neural2-H` - Female (clear)
- `en-US-Neural2-I` - Male (warm)
- `en-US-Neural2-J` - Male (authoritative)

**WaveNet Voices (Premium Quality):**
- `en-US-Wavenet-A` through `en-US-Wavenet-J`

**Standard Voices (Free Tier Eligible):**
- `en-US-Standard-A` through `en-US-Standard-J`

### How to Change Voice

Edit `generate-meditations-google.js` and change the `name` field:

```javascript
voice: {
  languageCode: 'en-US',
  name: 'en-US-Neural2-H', // Change this
  ssmlGender: 'FEMALE'      // Change to MALE if needed
}
```

## Customization Options

You can adjust these settings in `generate-meditations-google.js`:

```javascript
audioConfig: {
  audioEncoding: 'MP3',
  speakingRate: 0.85,      // 0.25 to 4.0 (1.0 = normal)
  pitch: -2.0,              // -20.0 to 20.0 (0 = normal)
  volumeGainDb: 0.0,        // -96.0 to 16.0 (0 = normal)
  effectsProfileId: ['headphone-class-device']
}
```

### Effects Profiles

- `headphone-class-device` - Optimized for headphones
- `handset-class-device` - Optimized for phone speakers
- `small-bluetooth-speaker-class-device` - For Bluetooth speakers
- `medium-bluetooth-speaker-class-device` - For larger speakers
- `large-home-entertainment-class-device` - For home theater

## Pricing

### Free Tier (First 1M characters/month)
- **Standard voices**: FREE
- After free tier: $4.00 per 1M characters

### Paid Tiers
- **WaveNet voices**: $16.00 per 1M characters
- **Neural2 voices**: $16.00 per 1M characters

### Cost for This Project
- Total characters: ~4,000
- Using Neural2: **< $0.10 USD**
- Using Standard (free tier): **$0.00**

## Troubleshooting

### Error: "GOOGLE_APPLICATION_CREDENTIALS not set"

**Solution:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/full/path/to/key.json"
```

Make sure to use the **full absolute path** to your JSON key file.

### Error: "API has not been used in project"

**Solution:**
1. Go to [APIs & Services](https://console.cloud.google.com/apis/library)
2. Search for "Cloud Text-to-Speech API"
3. Click "Enable"
4. Wait 1-2 minutes for it to propagate
5. Try running the script again

### Error: "Permission denied"

**Solution:**
Your service account needs the right permissions:
1. Go to [IAM](https://console.cloud.google.com/iam-admin/iam)
2. Find your service account
3. Click "Edit" (pencil icon)
4. Add role: "Cloud Text-to-Speech Client"
5. Save and try again

### Error: "403 Forbidden"

**Solution:**
Check your Google Cloud billing:
1. Go to [Billing](https://console.cloud.google.com/billing)
2. Make sure billing is enabled for your project
3. Note: Free tier doesn't require a credit card, but account must be verified

### Generated files are too quiet

**Solution:**
Increase the volume in `generate-meditations-google.js`:
```javascript
volumeGainDb: 6.0  // Increase from 0.0 to 6.0
```

### Voice sounds robotic

**Solution:**
1. Use Neural2 or WaveNet voices (not Standard)
2. Adjust speaking rate: `speakingRate: 0.90`
3. Add slight pitch variation: `pitch: -1.0`

## Testing the Generated Audio

1. Open your app in a browser
2. Click the AI Therapist button (bottom-right floating button)
3. Say or type: "I'd like to try a meditation"
4. Select any meditation
5. Click the play button
6. Audio should play with full controls

## Alternative: Using SSML for Better Control

For advanced customization, you can use SSML (Speech Synthesis Markup Language):

```javascript
const request = {
  input: {
    ssml: `
      <speak>
        <prosody rate="0.85" pitch="-2st">
          Take a comfortable seat and gently close your eyes.
          <break time="2s"/>
          Take three deep, slow breaths...
          <break time="1s"/>
          In through your nose...
          <break time="2s"/>
          and out through your mouth.
        </prosody>
      </speak>
    `
  },
  // ... rest of config
};
```

This gives you precise control over:
- Pauses (`<break time="2s"/>`)
- Emphasis (`<emphasis level="strong">`)
- Speed for specific words
- Pitch variations

## Resources

- **Google Cloud TTS Documentation**: https://cloud.google.com/text-to-speech/docs
- **Voice List**: https://cloud.google.com/text-to-speech/docs/voices
- **Pricing**: https://cloud.google.com/text-to-speech/pricing
- **SSML Reference**: https://cloud.google.com/text-to-speech/docs/ssml
- **Audio Profiles**: https://cloud.google.com/text-to-speech/docs/audio-profiles

## Security Best Practices

1. **Never commit your JSON key file** to version control
2. Add to `.gitignore`: `*.json` (be careful not to ignore package.json)
3. Keep credentials in a secure location outside your project directory
4. Use environment variables in production
5. Rotate keys periodically (every 90 days recommended)
6. Use least-privilege IAM roles

## Next Steps

After generating audio files:
1. Test each meditation in the app
2. Adjust voice/speed if needed and regenerate
3. Consider adding background music (see main README)
4. Deploy your app with the new audio files

## Support

If you encounter issues:
1. Check the [Google Cloud Status Dashboard](https://status.cloud.google.com/)
2. Review [Common Errors](https://cloud.google.com/text-to-speech/docs/troubleshooting)
3. Check browser console for playback errors
4. Verify file sizes (should be 1-2 MB each)

Happy meditating! 🧘‍♀️
