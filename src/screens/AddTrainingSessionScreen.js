import React from 'react';
import LogSessionForm from '../components/logbook/LogSessionForm';
import { useLogbook } from '../context/LogbookContext';
import { hapticSuccess } from '../lib/haptics';

function getDifficultyEmoji(difficulty) {
  return ({ 1: '🤩', 2: '😊', 3: '😐', 4: '😕', 5: '😓' })[difficulty] || '😐';
}

function generateInitialNotes(data) {
  let n = '';
  if (data.routineName && data.programName) n += `${data.programName} - ${data.routineName}\n\n`;
  if (data.exerciseLogs?.length > 0) {
    n += 'Exercise Results:\n';
    data.exerciseLogs.forEach((log, i) => {
      const name = log.exerciseName || log.name || log.title || `Exercise ${i + 1}`;
      const emoji = log.difficulty ? ` ${getDifficultyEmoji(log.difficulty)}` : '';
      n += `• ${name}: ${log.result}${emoji}`;
      if (log.target) n += ` (Target: ${log.target})`;
      if (log.notes) n += ` - ${log.notes}`;
      n += '\n';
    });
  }
  return n;
}

export default function AddTrainingSessionScreen({ navigation, route }) {
  const { addLogbookEntry } = useLogbook();
  const prefillData = route?.params?.prefillData;
  const isTrainingSession = prefillData?.sessionType === 'training';

  const handleSubmit = (entry) => {
    addLogbookEntry(entry);
    hapticSuccess();
    navigation.navigate('LogConfirmation', { entry, isTrainingSession });
  };

  return (
    <LogSessionForm
      navigation={navigation}
      mode="add"
      prefillData={prefillData}
      isTrainingSession={isTrainingSession}
      initialNotes={prefillData ? generateInitialNotes(prefillData) : ''}
      onSubmit={handleSubmit}
    />
  );
}
