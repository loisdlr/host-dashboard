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
    if (selectedCleaner?.id) {
      updateCleaner(selectedCleaner.id, { name: selectedCleaner.name });
      setEditVisible(false);
    }
  };

  const handleDelete = () => {
    if (!selectedCleaner?.id) return;
    
    Alert.alert("Confirm Delete", `Remove ${selectedCleaner.name}?`, [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete Staff", 
        style: "destructive", 
        onPress: () => {
          // 1. Call the delete function
          deleteCleaner(selectedCleaner.id);
          // 2. Close the modal immediately
          setEditVisible(false);
          // 3. Clear selection
          setSelectedCleaner(null);
        } 
      }
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader 
        title="Staff" 
        rightIcon="plus" 
        onRightPress={() => setAddVisible(true)} 
      />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 50 }}>
        {cleaners.map((item) => (
          <Pressable 
            key={item.id} 
            onPress={() => { setSelectedCleaner({...item}); setEditVisible(true); }}
            style={({ pressed }) => [
              styles.itemRow, 
              { borderBottomColor: c.border, opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: c.foreground }}>{item.name}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.mutedForeground} />
          </Pressable>
        ))}
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={isEditVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: c.background, padding: 20, paddingTop: 60 }}>
          <Text style={styles.modalTitle}>Edit Staff</Text>
          <TextInput 
            style={[styles.input, { borderColor: c.border, color: c.foreground }]}
            value={selectedCleaner?.name}
            onChangeText={(t) => setSelectedCleaner({ ...selectedCleaner, name: t })}
          />
          
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            <Pressable onPress={() => setEditVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></Pressable>
            <Pressable onPress={handleUpdate} style={styles.saveBtn}><Text style={{ color: 'white' }}>Update</Text></Pressable>
          </View>

          <Pressable onPress={handleDelete} style={styles.deleteBtn}>
            <Feather name="trash-2" size={18} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={{ color: '#ef4444', fontWeight: '600' }}>Remove Staff Member</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  itemRow: { flexDirection: 'row', paddingVertical: 20, alignItems: 'center', borderBottomWidth: 1 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, padding: 15, borderRadius: 12, fontSize: 18, marginBottom: 20 },
  cancelBtn: { flex: 1, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 12, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 16, backgroundColor: '#007AFF', borderRadius: 12, alignItems: 'center' },
  deleteBtn: { marginTop: 40, padding: 16, borderRadius: 12, backgroundColor: '#fff5f5', flexDirection: 'row', justifyContent: 'center' }
});