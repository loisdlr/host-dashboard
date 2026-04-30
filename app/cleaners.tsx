import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
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

  const openEdit = (cleaner: any) => {
    setSelectedCleaner({ ...cleaner });
    setEditVisible(true);
  };

  const handleUpdate = () => {
    if (selectedCleaner?.id && selectedCleaner.name?.trim()) {
      updateCleaner(selectedCleaner.id, { name: selectedCleaner.name.trim() });
      setEditVisible(false);
      setSelectedCleaner(null);
    }
  };

  const handleDelete = () => {
    console.log("=== DELETE BUTTON PRESSED ===", selectedCleaner?.id);

    if (!selectedCleaner?.id) return;

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to remove "${selectedCleaner.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
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

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {cleaners.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999', marginTop: 100 }}>
            No staff members yet
          </Text>
        ) : (
          cleaners.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => openEdit(item)}
              style={styles.itemRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.idText}>
                  ID: {item.id ? String(item.id).slice(0, 8) : 'MISSING'}
                </Text>
              </View>
              <Feather name="edit-2" size={20} color={c.primary} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* ==================== EDIT MODAL ==================== */}
      <Modal visible={isEditVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View style={{ flex: 1, padding: 20, paddingTop: 80 }}>
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
              <TouchableOpacity
                onPress={() => {
                  setEditVisible(false);
                  setSelectedCleaner(null);
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleUpdate} style={styles.saveBtn}>
                <Text style={styles.saveText}>Update</Text>
              </TouchableOpacity>
            </View>

            {/* DELETE BUTTON */}
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              style={styles.deleteBtn}
            >
              <Feather name="trash-2" size={24} color="#ef4444" />
              <Text style={styles.deleteText}>Remove Staff Member</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ADD MODAL */}
      <Modal visible={isAddVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View style={{ flex: 1, padding: 20, paddingTop: 80 }}>
            <Text style={styles.modalTitle}>New Staff Member</Text>

            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.foreground }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter name..."
              autoFocus
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => {
                  setAddVisible(false);
                  setNewName("");
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleAdd} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  idText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
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
    marginBottom: 50,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
  saveBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteBtn: {
    padding: 18,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  deleteText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 17,
  },
});