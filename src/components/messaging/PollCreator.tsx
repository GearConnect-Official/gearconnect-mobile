import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import theme from '@/theme';

export interface PollOption {
  id: string;
  text: string;
}

export interface PollData {
  question: string;
  options: PollOption[];
  allowMultipleAnswers?: boolean;
  isAnonymous?: boolean;
}

interface PollCreatorProps {
  visible: boolean;
  onSend: (poll: PollData) => void;
  onCancel: () => void;
  initialData?: PollData;
}

const PollCreator: React.FC<PollCreatorProps> = ({ visible, onSend, onCancel, initialData }) => {
  const isEditMode = !!initialData;
  const [question, setQuestion] = useState(initialData?.question || '');
  const [options, setOptions] = useState<PollOption[]>(
    initialData?.options || [
    { id: '1', text: '' },
    { id: '2', text: '' },
    ]
  );
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(initialData?.allowMultipleAnswers || false);
  const [isAnonymous, setIsAnonymous] = useState(initialData?.isAnonymous || false);

  // Reset form when initialData changes or modal opens
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setQuestion(initialData.question || '');
        setOptions(initialData.options || [{ id: '1', text: '' }, { id: '2', text: '' }]);
        setAllowMultipleAnswers(initialData.allowMultipleAnswers || false);
        setIsAnonymous(initialData.isAnonymous || false);
      } else {
        setQuestion('');
        setOptions([{ id: '1', text: '' }, { id: '2', text: '' }]);
        setAllowMultipleAnswers(false);
        setIsAnonymous(false);
      }
    }
  }, [visible, initialData]);

  const handleAddOption = () => {
    if (options.length >= 10) {
      Alert.alert('Limit Reached', 'You can add up to 10 options');
      return;
    }
    setOptions([...options, { id: Date.now().toString(), text: '' }]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) {
      Alert.alert('Minimum Required', 'A poll must have at least 2 options');
      return;
    }
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const handleSend = () => {
    // Validation
    if (!question.trim()) {
      Alert.alert('Invalid Poll', 'Please enter a question');
      return;
    }

    const validOptions = options.filter((opt) => opt.text.trim());
    if (validOptions.length < 2) {
      Alert.alert('Invalid Poll', 'Please add at least 2 options');
      return;
    }

    onSend({
      question: question.trim(),
      options: validOptions,
      allowMultipleAnswers,
      isAnonymous,
    });

    // Reset form
    setQuestion('');
    setOptions([
      { id: '1', text: '' },
      { id: '2', text: '' },
    ]);
    setAllowMultipleAnswers(false);
    setIsAnonymous(false);
  };

  const handleCancel = () => {
    setQuestion('');
    setOptions([
      { id: '1', text: '' },
      { id: '2', text: '' },
    ]);
    setAllowMultipleAnswers(false);
    setIsAnonymous(false);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditMode ? 'Edit Poll' : 'Create Poll'}</Text>
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>{isEditMode ? 'Edit' : 'Create'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Question</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="Ask a question..."
              placeholderTextColor={theme.colors.text.secondary}
              value={question}
              onChangeText={setQuestion}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{question.length}/200</Text>
          </View>

          {/* Options */}
          <View style={styles.section}>
            <View style={styles.optionsHeader}>
              <Text style={styles.label}>Options</Text>
              {options.length < 10 && (
                <TouchableOpacity onPress={handleAddOption} style={styles.addOptionButton}>
                  <FontAwesome name="plus" size={16} color={theme.colors.primary.main} />
                  <Text style={styles.addOptionText}>Add Option</Text>
                </TouchableOpacity>
              )}
            </View>

            {options.map((option, index) => (
              <View key={option.id} style={styles.optionRow}>
                <View style={styles.optionNumber}>
                  <Text style={styles.optionNumberText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor={theme.colors.text.secondary}
                  value={option.text}
                  onChangeText={(text) => handleOptionChange(option.id, text)}
                  maxLength={100}
                />
                {options.length > 2 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveOption(option.id)}
                    style={styles.removeButton}
                  >
                    <FontAwesome name="times" size={18} color={theme.colors.status.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.label}>Settings</Text>
            
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setAllowMultipleAnswers(!allowMultipleAnswers)}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <FontAwesome
                  name={allowMultipleAnswers ? 'check-square' : 'square'}
                  size={20}
                  color={allowMultipleAnswers ? theme.colors.primary.main : theme.colors.text.secondary}
                />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Allow multiple answers</Text>
                  <Text style={styles.settingDescription}>
                    Users can select more than one option
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setIsAnonymous(!isAnonymous)}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <FontAwesome
                  name={isAnonymous ? 'check-square' : 'square'}
                  size={20}
                  color={isAnonymous ? theme.colors.primary.main : theme.colors.text.secondary}
                />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Anonymous poll</Text>
                  <Text style={styles.settingDescription}>
                    Hide who voted for each option
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.paper,
  },
  cancelButton: {
    padding: theme.spacing.xs,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  sendButton: {
    padding: theme.spacing.xs,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  questionInput: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  addOptionText: {
    fontSize: 14,
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary.light + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  optionInput: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  settingRow: {
    marginBottom: theme.spacing.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});

export default PollCreator;
