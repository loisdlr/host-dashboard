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

  const handleUpdate = () => {
    if (selectedCleaner?.id && selectedCleaner.name?.trim()) {
      updateCleaner(selectedCleaner.id, { name: selectedCleaner.name.trim() });
      setEditVisible(false);
      setSelectedCleaner(null);
    }
  };

  const handleDelete = () => {
    if (!selectedCleaner?.id) return;

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to remove ${selectedCleaner.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Staff", 
          style: "destructive", 
          onPress: () => {
            deleteCleaner(selectedCleaner.id);
            setEditVisible(false);
            setSelectedCleaner(null);
          } 
        }
      ]
    );
  };

  const openEdit = (cleaner: any) => {
    setSelectedCleaner({ ...cleaner });
    setEditVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader 
        title="Staff" 
        rightIcon="plus" 
        onRightPress={() => setAddVisible(true)} 
      />
      
      <ScrollView 
        contentContainerStyle={{ 
          padding: 16, 
          paddingBottom: insets.bottom + 40 
        }}
      >
        {cleaners.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>
            No staff members yet
          </Text>
        ) : (
          cleaners.map((item) => (
            <Pressable 
              key={item.id} 
              onPress={() => openEdit(item)}
              style={styles.itemRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: c.foreground }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 10, color: '#999' }}>
                  ID: {item.id ? String(item.id).slice(0, 8) : 'MISSING'}
                </Text>
              </View>
              <Feather name="edit-2" size={18} color={c.primary} />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal 
        visible={isEditVisible} 
        animationType="slide" 
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Staff</Text>

          <TextInput 
            style={[styles.input, { borderColor: c.border, color: c.foreground }]}
            value={selectedCleaner?.name || ''}
            onChangeText={(t) => setSelectedCleaner(prev => prev ? { ...prev, name: t } : null)}
            placeholder="Staff name"
            autoFocus
          />

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <Pressable 
              onPress={() => {
                setEditVisible(false);
                setSelectedCleaner(null);
              }} 
              style={styles.cancelBtn}
            >
              <Text style={{ color: '#666' }}>Cancel</Text>
            </Pressable>

            <Pressable 
              onPress={handleUpdate} 
              style={styles.saveBtn}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Update</Text>
            </Pressable>
          </View>

          {/* Delete Button - Now properly at the bottom */}
          <Pressable 
            onPress={handleDelete} 
            style={styles.deleteBtn}
          >
            <Feather name="trash-2" size={20} color="#ef4444" />
            <Text style={styles.deleteBtnText}>Remove Staff Member</Text>
          </Pressable>
        </View>
      </Modal>

      {/* ADD MODAL */}
      <Modal 
        visible={isAddVisible} 
        animationType="slide" 
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>New Staff Member</Text>
          
          <TextInput 
            style={[styles.input, { borderColor: c.border, color: c.foreground }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter name..."
            autoFocus
          />

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <Pressable 
              onPress={() => {
                setAddVisible(false);
                setNewName("");
              }} 
              style={styles.cancelBtn}
            >
              <Text style={{ color: '#666' }}>Cancel</Text>
            </Pressable>

            <Pressable 
              onPress={() => {
                if (newName.trim()) {
                  addCleaner({ name: newName.trim() });
                  setAddVisible(false);
                  setNewName("");
                }
              }} 
              style={styles.saveBtn}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  itemRow: { 
    flexDirection: 'row', 
    paddingVertical: 18, 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white', // or c.background if you prefer
    padding: 20,
    paddingTop: 60,
  },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 24 
  },
  input: { 
    borderWidth: 1, 
    padding: 16, 
    borderRadius: 12, 
    fontSize: 18, 
    marginBottom: 12 
  },
  cancelBtn: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#f3f4f6', 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  saveBtn: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#007AFF', 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  deleteBtn: {
    marginTop: 'auto',
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff5f5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  }
});