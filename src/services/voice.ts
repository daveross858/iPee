// src/services/voice.ts
import * as Speech from 'expo-speech';

export function speak(text: string) {
  Speech.speak(text, { language: 'en-US' });
}
