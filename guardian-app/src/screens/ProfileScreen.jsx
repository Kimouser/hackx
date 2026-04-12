import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import colors from '../theme/colors';

// Mock user data - in production this would come from context/state
const CURRENT_USER = {
  name: 'Falgun',
  email: 'falgun@example.com',
  phone: '+91 98765 43210',
  aadhar: '[Aadhar Redacted]', 
  area: 'Ahmedabad, Gujarat',
  joinDate: 'January 2024',
  reportsSubmitted: 12,
  upvotesReceived: 45,
};

const ProfileScreen = ({ navigation }) => {
  // --- STATE FOR EMERGENCY CONTACTS ---
  const [contacts, setContacts] = useState([
    { id: '1', name: 'Mom', phone: '+91 98765 43210' },
    { id: '2', name: 'Brother', phone: '+91 87654 32109' }
  ]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // --- HANDLERS ---
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => navigation.navigate('Auth') },
      ]
    );
  };

  const handleAddContact = () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Error', 'Please enter both name and phone number.');
      return;
    }
    const newContact = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim()
    };
    setContacts([...contacts, newContact]);
    setNewName('');
    setNewPhone('');
    setModalVisible(false);
  };

  const handleRemoveContact = (id) => {
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{CURRENT_USER.name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{CURRENT_USER.name}</Text>
          <Text style={styles.email}>{CURRENT_USER.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{CURRENT_USER.reportsSubmitted}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{CURRENT_USER.upvotesReceived}</Text>
            <Text style={styles.statLabel}>Upvotes</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{CURRENT_USER.joinDate.split(' ')[1]}</Text>
            <Text style={styles.statLabel}>Member</Text>
          </View>
        </View>

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📱 Phone</Text>
            <Text style={styles.detailValue}>{CURRENT_USER.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📧 Email</Text>
            <Text style={styles.detailValue}>{CURRENT_USER.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🆔 Aadhar</Text>
            <Text style={styles.detailValue}>{CURRENT_USER.aadhar}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Area</Text>
            <Text style={styles.detailValue}>{CURRENT_USER.area}</Text>
          </View>
        </View>

        {/* --- EMERGENCY CONTACTS MANAGER (NEW) --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <Text style={styles.sectionSubtitle}>{contacts.length}/5</Text>
          </View>

          {contacts.length === 0 ? (
            <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
          ) : (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactRow}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeBtn} 
                  onPress={() => handleRemoveContact(contact.id)}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {contacts.length < 5 && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Add Trusted Contact</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- ADD CONTACT MODAL --- */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Name (e.g., Mom)"
              placeholderTextColor={colors.textMuted}
              value={newName}
              onChangeText={setNewName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancel]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalSave]} 
                onPress={handleAddContact}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.safe,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.bg,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.safe,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 0, // Reset for row flex
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  
  // --- NEW STYLES FOR EMERGENCY CONTACTS ---
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  contactPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 60, 60, 0.1)', 
  },
  removeBtnText: {
    color: colors.threat,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  addButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.safe,
    fontWeight: '700',
    fontSize: 14,
  },
  
  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    color: colors.textPrimary,
    marginBottom: 16,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalCancel: {
    backgroundColor: 'transparent',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 16,
  },
  modalSave: {
    backgroundColor: colors.safe,
  },
  modalSaveText: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: 16,
  },

  logoutContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: colors.threat,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;