import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
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

  // Handle Update
  const handleUpdate = () => {
    if (selectedCleaner?.id && selectedCleaner.name?.trim()) {
      updateCleaner(selectedCleaner.id, { name: selectedCleaner.name.trim() });
      setEditVisible(false);
      setSelectedCleaner(null);
    }
  };

  // Handle Delete with confirmation
  const handleDelete = () => {
    if (!selectedCleaner?.id) return;

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to remove "${selectedCleaner.name}"?\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Staff",
          style: "destructive",
          onPress: () => {
            deleteCleaner(selectedCleaner.id);
            setEditVisible(false);
            setSelectedCleaner(null);
          },
        },
      ]
    );
  };

  // Open Edit Modal
  const openEdit = (cleaner: any) => {
    setSelectedCleaner({ ...cleaner });
    setEditVisible(true);
  };

  // Add New Cleaner
  const handleAddCleaner = () => {
    if (newName.trim()) {
      addCleaner({ name: newName.trim() });
      setAddVisible(false);
      setNewName("");
    }
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
          paddingBottom: insets.bottom + 40,
        }}
      >
        {cleaners.length === 0 ? (
          <Text style={styles.emptyText}>
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
                <Text style={styles.cleanerName}>{item.name}</Text>
                <Text style={styles.cleanerId}>
                  ID: {item.id ? String(item.id).slice(0, 8) : 'MISSING'}
                </Text>
              </View>
              <Feather name="edit-2" size={18} color={c.primary} />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={isEditVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Staff</Text>

          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.foreground }]}
            value={selectedCleaner?.name || ''}
            onChangeText={(text) =>
              setSelectedCleaner((prev: any) => (prev ? { ...prev, name: text } : null))
            }
            placeholder="Staff name"
            autoFocus
          />

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => {
                setEditVisible(false);
                setSelectedCleaner(null);
              }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable onPress={handleUpdate} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Update</Text>
            </Pressable>
          </View>

          {/* Delete Button - Fixed with proper flex layout */}
          <Pressable onPress={handleDelete} style={styles.deleteBtn}>
            <Feather name="trash-2" size={20} color="#ef4444" />
            <Text style={styles.deleteBtnText}>Remove Staff Member</Text>
          </Pressable>
        </View>
      </Modal>

      {/* ADD MODAL */}
      <Modal visible={isAddVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>New Staff Member</Text>

          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.foreground }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter staff name..."
            autoFocus
          />

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => {
                setAddVisible(false);
                setNewName("");
              }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable onPress={handleAddCleaner} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
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
    borderBottomColor: '#eeeeee',
  },
  cleanerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cleanerId: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 80,
    fontSize: 16,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'column',           // Important for marginTop: 'auto'
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  // Delete Button
  deleteBtn: {
    marginTop: 'auto',           // Now works correctly
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fee2e2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
});