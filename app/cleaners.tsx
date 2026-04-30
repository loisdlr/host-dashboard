import React, { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function CleanersScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { cleaners, deleteCleaner, updateCleaner, addCleaner } = useRental();
  
  const [isAddVisible, setAddVisible] = useState(false);
  const [isEditVisible, setEditVisible] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState<any>(null);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCleaner({ name: newName.trim(), phone: "", ratePerClean: 450 });
    setNewName("");
    setAddVisible(false);
  };

  const handleUpdate = () => {
    if (selectedCleaner?.id) {
      updateCleaner(selectedCleaner.id, { name: selectedCleaner.name });
      setEditVisible(false);
      setSelectedCleaner(null);
    }
  };

  const handleDeleteInsideEdit = () => {
    if (!selectedCleaner?.id) {
      Alert.alert("Error", "Could not find ID for this staff member.");
      return;
    }

    const cleanerIdToDelete = String(selectedCleaner.id);

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to remove ${selectedCleaner.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Staff", 
          style: "destructive", 
          onPress: () => {
            deleteCleaner(cleanerIdToDelete); // Call the context function
            setEditVisible(false);
            setSelectedCleaner(null);
          } 
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader 
        title="Staff Management" 
        rightIcon="plus" 
        onRightPress={() => setAddVisible(true)} 
      />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 50 }}>
        {cleaners.map((item) => (
          <View key={item.id} style={[styles.itemRow, { borderBottomColor: c.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: c.foreground }}>{item.name}</Text>
            </View>

            <Pressable 
              onPress={() => { setSelectedCleaner({...item}); setEditVisible(true); }}
              style={styles.editTrigger}
            >
              <Feather name="edit-2" size={20} color={c.primary} />
              <Text style={{ color: c.primary, fontWeight: '500' }}>Edit</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* ADD MODAL */}
      <Modal visible={isAddVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: c.background, padding: 20, paddingTop: 60 }}>
          <Text style={styles.modalTitle}>Add Staff</Text>
          <TextInput 
            style={[styles.input, { borderColor: c.border, color: c.foreground }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter name..."
            placeholderTextColor="#999"
          />
          <View style={styles.modalButtons}>
            <Pressable onPress={() => setAddVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></Pressable>
            <Pressable onPress={handleAdd} style={styles.saveBtn}><Text style={{ color: 'white' }}>Save</Text></Pressable>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL (Now includes Delete) */}
      <Modal visible={isEditVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: c.background, padding: 20, paddingTop: 60 }}>
          <Text style={styles.modalTitle}>Edit Staff</Text>
          
          <View style={{ marginBottom: 30 }}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={[styles.input, { borderColor: c.border, color: c.foreground }]}
              value={selectedCleaner?.name}
              onChangeText={(t) => setSelectedCleaner(selectedCleaner ? { ...selectedCleaner, name: t } : null)}
            />
          </View>

          <View style={styles.modalButtons}>
            <Pressable onPress={() => setEditVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></Pressable>
            <Pressable onPress={handleUpdate} style={styles.saveBtn}><Text style={{ color: 'white' }}>Update</Text></Pressable>
          </View>

          {/* DANGER ZONE */}
          <View style={{ marginTop: 'auto', marginBottom: insets.bottom + 20 }}>
            <Pressable 
              onPress={handleDeleteInsideEdit} 
              style={styles.deleteBtn}
            >
              <Feather name="trash-2" size={18} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={{ color: '#ef4444', fontWeight: '600' }}>Delete Staff Member</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  itemRow: { flexDirection: 'row', paddingVertical: 18, alignItems: 'center', borderBottomWidth: 1 },
  editTrigger: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 25 },
  label: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1, padding: 15, borderRadius: 12, fontSize: 18 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 12, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 16, backgroundColor: '#007AFF', borderRadius: 12, alignItems: 'center' },
  deleteBtn: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#fee2e2', 
    borderRadius: 12,
    backgroundColor: '#fff5f5'
  }
});