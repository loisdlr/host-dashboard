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
  SafeAreaView,
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

  const handleUpdate = () => {
    if (selectedCleaner?.id && selectedCleaner.name?.trim()) {
      updateCleaner(selectedCleaner.id, { name: selectedCleaner.name.trim() });
      setEditVisible(false);
      setSelectedCleaner(null);
    }
  };

  const handleDelete = () => {
    if (!selectedCleaner?.id) {
      Alert.alert("Error", "No staff selected");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to remove "${selectedCleaner.name}"?`,
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

  const openEdit = (cleaner: any) => {
    setSelectedCleaner({ ...cleaner });
    setEditVisible(true);
  };

  const handleAdd = () => {
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        {cleaners.length === 0 ? (
          <Text style={styles.emptyText}>No staff members yet</Text>
        ) : (
          cleaners.map((item) => (
            <Pressable key={item.id} onPress={() => openEdit(item)} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.idText}>
                  ID: {item.id ? String(item.id).slice(0, 8) : 'MISSING'}
                </Text>
              </View>
              <Feather name="edit-2" size={20} color={c.primary} />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* EDIT MODAL - Simplified & Debugged */}
      <Modal visible={isEditVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Staff</Text>

            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.foreground }]}
              value={selectedCleaner?.name || ''}
              onChangeText={(t) =>
                setSelectedCleaner((prev: any) => (prev ? { ...prev, name: t } : null))
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
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable onPress={handleUpdate} style={styles.saveBtn}>
                <Text style={styles.saveText}>Update</Text>
              </Pressable>
            </View>

            {/* Delete Button with extra debugging styles */}
            <Pressable
              onPress={handleDelete}
              style={styles.deleteBtn}
              // These help with debugging:
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Feather name="trash-2" size={22} color="#ef4444" />
              <Text style={styles.deleteText}>Remove Staff Member</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ADD MODAL */}
      <Modal visible={isAddVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Staff Member</Text>

            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.foreground }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter name..."
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
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable onPress={handleAdd} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
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
    borderBottomColor: '#eee',
  },
  name: { fontSize: 16, fontWeight: '600' },
  idText: { fontSize: 10, color: '#999', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 80, fontSize: 16 },

  modalSafeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: { color: '#666', fontSize: 16, fontWeight: '500' },
  saveBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: 'white', fontWeight: '600', fontSize: 16 },

  deleteBtn: {
    marginTop: 'auto',
    marginBottom: 40,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#fff5f5',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  deleteText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
});