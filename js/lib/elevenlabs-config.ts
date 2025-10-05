export const JUDGE_VOICES = {
  judge_1: {
    voice_id: "pNInz6obpgDQGcFmaJgB", // Adam - old man voice
    name: "Bob",
    description: "Prompt Quality Expert",
    voice_settings: {
      stability: 0.4, // Steady old man voice
      similarity_boost: 0.9, // High character
      style: 0.2, // Subtle expression
      use_speaker_boost: true
    }
  },
  judge_2: {
    voice_id: "AZnzlk1XvdvUeBnXmlld", // Domi - energetic female
    name: "Bobby", 
    description: "Database Optimization Specialist",
    voice_settings: {
      stability: 0.2, // Very expressive
      similarity_boost: 0.9, // High character
      style: 0.6, // Very expressive
      use_speaker_boost: true
    }
  },
  judge_3: {
    voice_id: "ErXwobaYiN019PkySvjV", // Antoni - deep male voice
    name: "Bobert",
    description: "Security & Safety Auditor",
    voice_settings: {
      stability: 0.4, // Moderately expressive
      similarity_boost: 0.7, // Good character
      style: 0.3, // Subtle expression
      use_speaker_boost: true
    }
  },
  judge_4: {
    voice_id: "TxGEqnHWrfWFTfGW9XjX", // Jeremy - casual male voice
    name: "Bro",
    description: "Cost & Efficiency Analyst",
    voice_settings: {
      stability: 0.25, // Very expressive
      similarity_boost: 0.85, // High character
      style: 0.5, // Expressive
      use_speaker_boost: true
    }
  }
} as const;

export type JudgeId = keyof typeof JUDGE_VOICES;
