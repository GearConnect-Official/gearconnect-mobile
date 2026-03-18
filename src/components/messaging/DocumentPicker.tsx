import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import theme from '@/theme';
import { validateFileSafety } from '@/utils/fileSecurity';

export interface SelectedDocument {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
  publicId?: string;
  secureUrl?: string;
}

interface DocumentPickerProps {
  visible: boolean;
  onDocumentSelected: (document: SelectedDocument) => void;
  onCancel: () => void;
}


const DocumentPickerModal: React.FC<DocumentPickerProps> = ({
  visible,
  onDocumentSelected,
  onCancel,
}) => {

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types initially, we'll validate after
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const document = result.assets[0];
      
      if (!document.uri) {
        Alert.alert('Error', 'Failed to access document');
        return;
      }

      // Validate file safety
      const fileName = document.name || 'document';
      const validation = validateFileSafety(fileName, document.mimeType);
      
      if (!validation.isValid) {
        Alert.alert(
          'File Not Allowed',
          validation.error || 'This file type is not allowed for security reasons.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Create document object
      const selectedDocument: SelectedDocument = {
        uri: document.uri,
        name: fileName,
        mimeType: document.mimeType,
        size: document.size,
      };

      onDocumentSelected(selectedDocument);
    } catch (error: any) {
      console.error('Error picking document:', error);
      Alert.alert('Error', error.message || 'Failed to pick document');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Document</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <FontAwesome name="times" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <TouchableOpacity
              style={styles.pickButton}
              onPress={handlePickDocument}
              activeOpacity={0.7}
            >
              <View style={styles.pickButtonIcon}>
                <FontAwesome name="file" size={48} color={theme.colors.primary.main} />
              </View>
              <Text style={styles.pickButtonText}>Choose File</Text>
              <Text style={styles.pickButtonSubtext}>
                Select a document from your device
              </Text>
            </TouchableOpacity>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Supported file types:</Text>
              <View style={styles.fileTypesList}>
                <Text style={styles.fileType}>• PDF documents (.pdf)</Text>
                <Text style={styles.fileType}>• Word documents (.doc, .docx)</Text>
                <Text style={styles.fileType}>• Excel spreadsheets (.xls, .xlsx)</Text>
                <Text style={styles.fileType}>• PowerPoint presentations (.ppt, .pptx)</Text>
                <Text style={styles.fileType}>• Text files (.txt, .csv)</Text>
                <Text style={styles.fileType}>• Archives (.zip, .rar, .7z)</Text>
                <Text style={styles.fileType}>• Images (.jpg, .png, .gif, etc.)</Text>
              </View>
              <View style={styles.securityNote}>
                <FontAwesome name="shield" size={14} color={theme.colors.status.warning} />
                <Text style={styles.securityNoteText}>
                  Executable files and scripts are blocked for security reasons.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  pickButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.grey[100],
    borderRadius: 16,
    marginBottom: theme.spacing.xl,
  },
  pickButtonIcon: {
    marginBottom: theme.spacing.md,
  },
  pickButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  pickButtonSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  infoSection: {
    marginTop: theme.spacing.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  fileTypesList: {
    gap: theme.spacing.xs,
  },
  fileType: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.status.warning + '15',
    borderRadius: 8,
    gap: theme.spacing.xs,
  },
  securityNoteText: {
    fontSize: 12,
    color: theme.colors.status.warning,
    flex: 1,
    lineHeight: 16,
  },
});

export default DocumentPickerModal;
