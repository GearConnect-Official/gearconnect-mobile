import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import theme from '@/theme';

export interface ContactData {
  name: string;
  phoneNumbers: string[];
  emails: string[];
  organization?: string;
  jobTitle?: string;
}

interface ContactPickerModalProps {
  visible: boolean;
  onSend: (contact: ContactData) => void;
  onCancel: () => void;
}

const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  visible,
  onSend,
  onCancel,
}) => {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contacts.Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (visible) {
      requestContactsPermission();
    } else {
      // Reset state when modal closes
      setContacts([]);
      setFilteredContacts([]);
      setSearchQuery('');
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = contacts.filter((contact) => {
        const name = contact.name?.toLowerCase() || '';
        const phoneMatch = contact.phoneNumbers?.some((phone) =>
          phone.number?.toLowerCase().includes(query)
        );
        const emailMatch = contact.emails?.some((email) =>
          email.email?.toLowerCase().includes(query)
        );
        return name.includes(query) || phoneMatch || emailMatch;
      });
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  const requestContactsPermission = async () => {
    try {
      setLoading(true);
      const { status } = await Contacts.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your contacts to share them.',
          [{ text: 'OK', onPress: onCancel }]
        );
        setLoading(false);
        return;
      }

      // Fetch contacts
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Company,
          Contacts.Fields.JobTitle,
        ],
      });

      // Sort contacts by name
      const sortedContacts = data.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      });

      setContacts(sortedContacts);
      setFilteredContacts(sortedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const formatContactData = (contact: Contacts.Contact): ContactData => {
    return {
      name: contact.name || 'Unknown',
      phoneNumbers: contact.phoneNumbers?.map((p) => p.number || '').filter(Boolean) || [],
      emails: contact.emails?.map((e) => e.email || '').filter(Boolean) || [],
      organization: contact.company || undefined,
      jobTitle: contact.jobTitle || undefined,
    };
  };

  const handleSelectContact = (contact: Contacts.Contact) => {
    const contactData = formatContactData(contact);
    onSend(contactData);
  };

  const renderContactItem = ({ item }: { item: Contacts.Contact }) => {
    const name = item.name || 'Unknown';
    const phoneNumber = item.phoneNumbers?.[0]?.number || '';
    const email = item.emails?.[0]?.email || '';

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleSelectContact(item)}
        activeOpacity={0.7}
      >
        <View style={styles.contactAvatar}>
          <FontAwesome name="user" size={24} color={theme.colors.text.secondary} />
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{name}</Text>
          {phoneNumber ? (
            <Text style={styles.contactDetail}>{phoneNumber}</Text>
          ) : email ? (
            <Text style={styles.contactDetail}>{email}</Text>
          ) : null}
        </View>
        <FontAwesome name="chevron-right" size={16} color={theme.colors.text.secondary} />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Contact</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="exclamation-circle" size={48} color={theme.colors.text.secondary} />
            <Text style={styles.emptyText}>Contacts permission required</Text>
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="address-book" size={48} color={theme.colors.text.secondary} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No contacts found' : 'No contacts available'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.searchContainer}>
              <FontAwesome name="search" size={18} color={theme.colors.text.secondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                placeholderTextColor={theme.colors.text.secondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <FontAwesome name="times-circle" size={18} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredContacts}
              renderItem={renderContactItem}
              keyExtractor={(item) => item.id}
              style={styles.contactsList}
              contentContainerStyle={styles.contactsListContent}
            />
          </>
        )}
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
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  cancelButton: {
    padding: theme.spacing.xs,
  },
  cancelText: {
    color: theme.colors.primary.main,
    fontSize: 16,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 60, // Same width as cancel button for centering
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  contactsList: {
    flex: 1,
  },
  contactsListContent: {
    paddingBottom: theme.spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.grey[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactDetail: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ContactPickerModal;
