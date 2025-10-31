import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModernIcon from './ModernIcon';

const LogResultComponent = ({ 
  exercise, 
  onResultSubmitted,
  onClose,
  visible = false,
  navigation 
}) => {
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [passed, setPassed] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSubmitResult = () => {
    const result = parseInt(userInput);
    const targetNum = parseInt(exercise.targetValue.split('/')[0]);
    const success = result >= targetNum;
    
    setPassed(success);
    setShowResult(true);
    
    // Call parent callback with result data
    if (onResultSubmitted) {
      onResultSubmitted({
        result: userInput,
        passed: success,
        date: new Date().toLocaleDateString(),
        exerciseId: exercise.code
      });
    }
  };

  const handleRetry = () => {
    setUserInput('');
    setShowResult(false);
    setPassed(false);
  };

  const handleShare = () => {
    Alert.alert('Success Shared!', 'Your achievement has been shared with your network.');
  };

  const handleNextExercise = () => {
    setShowResult(false);
    handleClose();
    if (navigation) {
      navigation.navigate('Training2');
    } else {
      Alert.alert('Great job!', 'Continue with your next exercise in the Program tab.');
    }
  };

  const handleClose = () => {
    setUserInput('');
    setShowResult(false);
    setPassed(false);
    if (onClose) {
      onClose();
    }
  };

  const renderLogDialog = () => (
    <View style={styles.dialogOverlay}>
      <View style={styles.dialogContent}>
        <View style={styles.dialogHeader}>
          <Text style={styles.dialogTitle}>Log Your Result</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
          >
            <ModernIcon name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.dialogBody}>
          <Text style={styles.exerciseTitle}>{exercise.title}</Text>
          <Text style={styles.exerciseTarget}>Target: {exercise.targetValue}</Text>
          
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Successful attempts:
            </Text>
            <TextInput
              style={styles.textInput}
              value={userInput}
              onChangeText={setUserInput}
              placeholder={`0-${exercise.targetValue.split('/')[1] || '10'}`}
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              maxLength={2}
              autoFocus={true}
            />
          </View>

          <View style={styles.dialogActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !userInput && styles.submitButtonDisabled]}
              onPress={handleSubmitResult}
              disabled={!userInput}
            >
              <Text style={[styles.submitButtonText, !userInput && styles.submitButtonTextDisabled]}>
                Submit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderResultModal = () => (
    <Modal
      visible={showResult}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowResult(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={[
              styles.modalIcon,
              { backgroundColor: passed ? '#F0FDF4' : '#FEF2F2' }
            ]}>
              <ModernIcon 
                name={passed ? "checkmark" : "close"} 
                size={32} 
                color={passed ? "#10B981" : "#EF4444"} 
              />
            </View>
            
            <Text style={[
              styles.modalTitle,
              { color: passed ? "#065F46" : "#991B1B" }
            ]}>
              {passed ? 'Drill Completed! 🎉' : 'Keep Practicing!'}
            </Text>
            
            <Text style={[
              styles.modalDescription,
              { color: passed ? "#047857" : "#B91C1C" }
            ]}>
              You scored {userInput}/{exercise.targetValue.split('/')[1] || '10'}
              {passed ? ' - Target achieved!' : ` - You need ${exercise.targetValue} to pass`}
            </Text>

            {passed && (
              <View style={styles.xpCard}>
                <ModernIcon name="star" size={16} color="#10B981" />
                <Text style={styles.xpText}>+50 XP earned</Text>
              </View>
            )}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.retryButton,
                passed && styles.secondaryButton
              ]}
              onPress={handleRetry}
            >
              <ModernIcon name="sync" size={16} color={passed ? "#6B7280" : "white"} />
              <Text style={[
                styles.modalButtonText,
                passed && styles.secondaryButtonText
              ]}>
                Try Again
              </Text>
            </TouchableOpacity>
            
            {passed && (
              <TouchableOpacity
                style={[styles.modalButton, styles.shareButton]}
                onPress={handleShare}
              >
                <ModernIcon name="share" size={16} color="white" />
                <Text style={styles.modalButtonText}>Share</Text>
              </TouchableOpacity>
            )}
          </View>

          {passed && (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextExercise}
            >
              <Text style={styles.nextButtonText}>Next Exercise →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      {renderLogDialog()}
      {renderResultModal()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Compact dialog styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  dialogBody: {
    padding: 20,
    paddingTop: 16,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  exerciseTarget: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    backgroundColor: '#F9FAFB',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  submitButtonTextDisabled: {
    color: '#9CA3AF',
  },
  // Modal styles (reused from ExerciseDetailScreen)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  xpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#047857',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
  },
  shareButton: {
    backgroundColor: '#10B981',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#374151',
  },
  nextButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default LogResultComponent;
