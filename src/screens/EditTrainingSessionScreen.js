import React from 'react';
import { Alert } from 'react-native';
import LogSessionForm from '../components/logbook/LogSessionForm';
import { useLogbook } from '../context/LogbookContext';
import { hapticSuccess } from '../lib/haptics';

export default function EditTrainingSessionScreen({ navigation, route }) {
  const { updateLogbookEntry } = useLogbook();
  const { entry } = route.params;

  const handleSubmit = (updatedEntry) => {
    updateLogbookEntry(entry.id, updatedEntry);
    hapticSuccess();
    Alert.alert('Updated', 'Your session has been updated.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <LogSessionForm
      navigation={navigation}
      mode="edit"
      initialEntry={entry}
      onSubmit={handleSubmit}
    />
  );
}
