import React, { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
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
      updateCleaner(selectedCleaner.id, { name: selectedCleaner.name.trim() });
      setEditVisible(false);
      setSelectedCleaner(null);
    }
  };

  const handleConfirmDelete = (id: string, name: string) => {
    Alert.alert(
      "Confirm Delete",
      `Delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => deleteCleaner(id) 
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader 
        title="Cleaners" 
        rightIcon="plus" 
        onRightPress={() => setAddVisible(true)} 
      />
      
      <ScrollView 
        key={`list-${cleaners.length}`} // FORCES RE-RENDER ON DELETE
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20, gap: 12 }}
      >
        {cleaners.map((item) => (
          <Card key={item.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: c.foreground, fontSize: 16 }}>{item.name}</Text>
            </View>
            
            <View style={styles.actions}>
              <Pressable 
                onPress={() => { setSelectedCleaner({...item}); setEditVisible(true); }}
                style={styles.iconBtn}
                hitSlop={10}
              >
                <Feather name="edit-2" size={20} color={c.primary} />
              </Pressable>
              
              <Pressable 
                onPress={() => handleConfirmDelete(item.id, item.name)}
                style={styles.iconBtn}
                hitSlop={10}
              >
                <Feather name="trash-2" size={20} color={c.destructive} />
              </Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* ADD MODAL */}
      <Modal visible={isAddVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: c.background, paddingTop: 50 }}>
          <ScreenHeader title="New Staff" leftIcon="x" onLeftPress={() => setAddVisible(false)} />
          <View style={styles.form}>
            <TextInput 
              style={[styles.input, { borderColor: c.border, color: c.foreground }]}
              placeholder="Name"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <Button label="Save Staff" onPress={handleAdd} />
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={isEditVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: c.background, paddingTop: 50 }}>
          <ScreenHeader title="Edit Staff" leftIcon="x" onLeftPress={() => setEditVisible(false)} />
          <View style={styles.form}>
            <TextInput 
              style={[styles.input, { borderColor: c.border, color: c.foreground }]}
              value={selectedCleaner?.name}
              onChangeText={(t) => setSelectedCleaner({...selectedCleaner, name: t})}
            />
            <Button label="Update Name" onPress={handleUpdate} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 16, alignItems: 'center', minHeight: 60 },
  actions: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 8 },
  form: { padding: 20, gap: 15 },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, fontSize: 16 }
});