import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@academypro_lastOpenedProgram';
const LEGACY_KEY = '@pickleHero_lastOpenedProgram';

export function useLastOpenedProgram() {
  const [lastProgram, setLastProgram] = useState(null);

  useEffect(() => {
    const loadLastProgram = async () => {
      let raw = await AsyncStorage.getItem(KEY);
      if (raw === null) {
        raw = await AsyncStorage.getItem(LEGACY_KEY);
        if (raw !== null) {
          await AsyncStorage.setItem(KEY, raw);
        }
      }
      if (raw) setLastProgram(JSON.parse(raw));
    };
    loadLastProgram().catch(() => {});
  }, []);

  const saveLastProgram = useCallback((program) => {
    if (!program) return;
    const slim = {
      id: program.id,
      title: program.title || program.name,
      imageUrl: program.imageUrl || program.image_url,
      coachName: program.coachName || program.coach_name,
      lastOpenedAt: new Date().toISOString(),
    };
    setLastProgram(slim);
    AsyncStorage.setItem(KEY, JSON.stringify(slim)).catch(() => {});
  }, []);

  const clearLastProgram = useCallback(() => {
    setLastProgram(null);
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  return { lastProgram, saveLastProgram, clearLastProgram };
}
