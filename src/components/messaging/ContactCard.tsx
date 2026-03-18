import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import theme from '@/theme';
import styles from '@/styles/components/messaging/contactCardStyles';

export interface ContactData {
  name: string;
  phoneNumbers: string[];
  emails: string[];
  organization?: string;
  jobTitle?: string;
}

interface ContactCardProps {
  contact: ContactData;
  isOwn: boolean;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, isOwn }) => {
  const handleAddToContacts = async () => {
    try {
      // Request permission first
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your contacts to add this contact.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Create contact object
      const newContact: Contacts.Contact = {
        name: contact.name,
        contactType: Contacts.ContactTypes.Person,
        phoneNumbers: contact.phoneNumbers.map((phone) => ({
          number: phone,
          label: 'mobile',
        })),
        emails: contact.emails.map((email) => ({
          email,
          label: 'work',
        })),
        company: contact.organization,
        jobTitle: contact.jobTitle,
      };

      // Add contact
      await Contacts.addContactAsync(newContact);
      
      Alert.alert('Success', 'Contact added to your address book');
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert('Error', 'Failed to add contact to address book');
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <TouchableOpacity
      style={[styles.container, isOwn && styles.ownContainer]}
      onPress={handleAddToContacts}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, isOwn && styles.ownIconContainer]}>
          <FontAwesome name="user" size={24} color={isOwn ? '#FFFFFF' : theme.colors.primary.main} />
        </View>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, isOwn && styles.ownContactName]}>
            {contact.name}
          </Text>
          {contact.organization && (
            <Text style={[styles.contactOrg, isOwn && styles.ownContactOrg]}>
              {contact.organization}
            </Text>
          )}
        </View>
      </View>

      {contact.phoneNumbers.length > 0 && (
        <View style={styles.contactDetails}>
          <FontAwesome name="phone" size={16} color={isOwn ? '#FFFFFF' : theme.colors.text.secondary} />
          <View style={styles.contactDetailsContent}>
            {contact.phoneNumbers.map((phone, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleCall(phone)}
                style={styles.contactDetailItem}
                activeOpacity={0.7}
              >
                <Text style={[styles.contactDetailText, isOwn && styles.ownContactDetailText]}>
                  {phone}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {contact.emails.length > 0 && (
        <View style={styles.contactDetails}>
          <FontAwesome name="envelope" size={16} color={isOwn ? '#FFFFFF' : theme.colors.text.secondary} />
          <View style={styles.contactDetailsContent}>
            {contact.emails.map((email, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleEmail(email)}
                style={styles.contactDetailItem}
                activeOpacity={0.7}
              >
                <Text style={[styles.contactDetailText, isOwn && styles.ownContactDetailText]}>
                  {email}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {contact.jobTitle && (
        <View style={styles.contactDetails}>
          <FontAwesome name="briefcase" size={16} color={isOwn ? '#FFFFFF' : theme.colors.text.secondary} />
          <Text style={[styles.contactDetailText, isOwn && styles.ownContactDetailText]}>
            {contact.jobTitle}
          </Text>
        </View>
      )}

      <View style={[styles.footer, isOwn && styles.ownFooter]}>
        <Text style={[styles.addContactText, isOwn && styles.ownAddContactText]}>
          Tap to add to contacts
        </Text>
        <FontAwesome name="plus-circle" size={16} color={isOwn ? '#FFFFFF' : theme.colors.primary.main} />
      </View>
    </TouchableOpacity>
  );
};

export default ContactCard;
