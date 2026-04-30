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
  const { cleaners, deleteCleaner, updateCleaner, addCleaner, reset } = useRental();
  
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

            <View style={{ flexDirection: 'row', gap: 20 }}>
              <Pressable onPress={() => { setSelectedCleaner({...item}); setEditVisible(true); }}>
                <Feather name="edit-2" size={20} color={c.primary} />
              </Pressable>

              <Pressable onPress={() => {
                Alert.alert("Delete", `Remove ${item.name}?`, [
                  { text: "Cancel" },
                  { text: "Delete", style: "destructive", onPress: () => deleteCleaner(item.id) }
                ]);
              }}>
                <Feather name="trash-2" size={20} color={c.destructive} />
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable 
          onPress={() => Alert.alert("Reset", "Wipe all data?", [{ text: "No" }, { text: "Yes", onPress: reset }])}
          style={{ marginTop: 40, padding: 15, backgroundColor: '#fee2e2', borderRadius: 8 }}
        >
          <Text style={{ color: '#ef4444', textAlign: 'center', fontWeight: 'bold' }}>HARD RESET DATA</Text>
        </Pressable>
      </ScrollView>

      {/* ADD MODAL */}
      <Modal visible={isAddVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: c.background, padding: 20, paddingTop: 60 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: c.foreground, marginBottom: 20 }}>Add Staff</Text>
          <TextInput 
            style={[styles.input, { borderColor: c.border, color: c.foreground }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="Name..."
            placeholderTextColor="#999"
          />
          <View style={styles.modalButtons}>
            <Pressable onPress={() => setAddVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></Pressable>
            <Pressable onPress={handleAdd} style={styles.saveBtn}><Text style={{ color: 'white' }}>Save</Text></Pressable>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={isEditVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: c.background, padding: 20, paddingTop: 60 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: c.foreground, marginBottom: 20 }}>Edit Staff</Text>
          <TextInput 
            style={[styles.input, { borderColor: c.border, color: c.foreground }]}
            value={selectedCleaner?.name}
            onChangeText={(t) => setSelectedCleaner(selectedCleaner ? { ...selectedCleaner, name: t } : null)}
          />
          <View style={styles.modalButtons}>
            <Pressable onPress={() => setEditVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></Pressable>
            <Pressable onPress={handleUpdate} style={styles.saveBtn}><Text style={{ color: 'white' }}>Update</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  itemRow: { flexDirection: 'row', paddingVertical: 16, alignItems: 'center', borderBottomWidth: 1 },
  input: { borderWidth: 1, padding: 15, borderRadius: 10, fontSize: 18, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 15, backgroundColor: '#eee', borderRadius: 10, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 15, backgroundColor: '#007AFF', borderRadius: 10, alignItems: 'center' }
});