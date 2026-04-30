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
  
  // We take the raw setters too, just in case the wrapper functions are bugged
  const { cleaners, deleteCleaner, updateCleaner, addCleaner, reset } = useRental();
  
  const [isAddVisible, setAddVisible] = useState(false);
  const [isEditVisible, setEditVisible] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState<any>(null);
  const [newName, setNewName] = useState("");

  // FORCE DELETE LOGIC
  const forceDelete = (id: string) => {
    console.log("Nuclear Delete initiated for:", id);
    deleteCleaner(id);
    // If it still doesn't disappear, we know the context filter is the issue
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader 
        title="Cleaners" 
        rightIcon="plus" 
        onRightPress={() => setAddVisible(true)} 
      />
      
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, gap: 12 }}
      >
        {cleaners.map((item, index) => (
          <Card key={`${item.id}-${index}`} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: c.foreground }}>{item.name}</Text>
              <Text style={{ fontSize: 10, color: c.mutedForeground }}>ID: {item.id}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <Pressable 
                onPress={() => { setSelectedCleaner({...item}); setEditVisible(true); }}
                style={styles.iconBtn}
              >
                <Feather name="edit-2" size={20} color={c.primary} />
              </Pressable>
              
              <Pressable 
                onPress={() => {
                  Alert.alert("Delete?", `Remove ${item.name}?`, [
                    { text: "Cancel" },
                    { text: "Delete", style: "destructive", onPress: () => forceDelete(item.id) }
                  ]);
                }}
                style={styles.iconBtn}
              >
                <Feather name="trash-2" size={20} color={c.destructive} />
              </Pressable>
            </View>
          </Card>
        ))}

        {/* EMERGENCY RESET - This is now at the very bottom */}
        <View style={{ marginTop: 50, padding: 20, backgroundColor: '#fee2e2', borderRadius: 12 }}>
            <Text style={{ color: '#b91c1c', fontWeight: 'bold', textAlign: 'center' }}>EMERGENCY TOOLS</Text>
            <Pressable 
                onPress={() => reset()} 
                style={{ backgroundColor: '#ef4444', padding: 15, borderRadius: 8, marginTop: 10 }}
            >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>WIPE ALL DATA (RESET)</Text>
            </Pressable>
        </View>
      </ScrollView>

      {/* MODALS */}
      <Modal visible={isAddVisible} animationType="fade">
        <View style={{ flex: 1, backgroundColor: c.background, justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: c.foreground }}>New Staff</Text>
          <TextInput 
            style={[styles.input, { borderColor: c.border, color: c.foreground }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="Name"
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <Button label="Cancel" variant="secondary" onPress={() => setAddVisible(false)} style={{ flex: 1 }} />
            <Button label="Save" onPress={() => { addCleaner({ name: newName }); setAddVisible(false); setNewName(""); }} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={isEditVisible} animationType="fade">
        <View style={{ flex: 1, backgroundColor: c.background, justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: c.foreground }}>Edit Staff</Text>
          <TextInput 
            style={[styles.input, { borderColor: c.border, color: c.foreground }]}
            value={selectedCleaner?.name}
            onChangeText={(t) => setSelectedCleaner({...selectedCleaner, name: t})}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <Button label="Cancel" variant="secondary" onPress={() => setEditVisible(false)} style={{ flex: 1 }} />
            <Button label="Update" onPress={() => { updateCleaner(selectedCleaner.id, { name: selectedCleaner.name }); setEditVisible(false); }} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  iconBtn: { padding: 5 },
  input: { borderWidth: 1, padding: 15, borderRadius: 10, fontSize: 18 }
});