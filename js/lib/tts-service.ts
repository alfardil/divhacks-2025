import { JUDGE_VOICES, type JudgeId } from './elevenlabs-config';

export async function generateJudgeSpeech(
  judgeId: JudgeId, 
  text: string
): Promise<ArrayBuffer> {
  const voice = JUDGE_VOICES[judgeId];
  
  if (!voice) {
    throw new Error(`Voice not found for judge: ${judgeId}`);
  }

  // Get API key from environment
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ElevenLabs API key not found. Please add NEXT_PUBLIC_ELEVENLABS_API_KEY to your .env.local file');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice.voice_id}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: voice.voice_settings || {
          stability: 0.3,
          similarity_boost: 0.8,
          style: 0.4,
          use_speaker_boost: true
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs API Error:', errorText);
    throw new Error(`TTS API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.arrayBuffer();
}

export async function playJudgeVoice(judgeId: JudgeId, text: string): Promise<void> {
  try {
    const audioBuffer = await generateJudgeSpeech(judgeId, text);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    const audio = new Audio(audioUrl);
    await audio.play();
    
    // Clean up URL after playing
    audio.onended = () => URL.revokeObjectURL(audioUrl);
    audio.onerror = () => URL.revokeObjectURL(audioUrl);
  } catch (error) {
    console.error('TTS Error:', error);
    // Fallback to browser speech synthesis with masculine voices
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to get a male voice
      const voices = speechSynthesis.getVoices();
      const maleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('alex') ||
        voice.name.toLowerCase().includes('daniel') ||
        voice.name.toLowerCase().includes('thomas')
      );
      
      if (maleVoice) {
        utterance.voice = maleVoice;
      }
      
      // Adjust voice settings to sound more human and expressive
      utterance.rate = 0.9; // Slightly faster for more natural flow
      utterance.pitch = 0.8; // Slightly lower but not too deep
      utterance.volume = 1.0;
      
      speechSynthesis.speak(utterance);
    }
  }
}
