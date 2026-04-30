import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Modal, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  Alert 
} from 'react-native';
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

  const confirmDelete = (id: string, name: string) => {
    // If you see this Alert, the button is clickable.
    Alert.alert(
      "Confirm Delete",
      `Delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteCleaner(id) }
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
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20, gap: 12 }}
        // This ensures the ScrollView doesn't block children taps
        tapAnywhereToDismiss={false} 
      >
        {cleaners.map((item) => (
          <Card key={item.id} style={styles.card}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ fontWeight: '600', color: c.foreground, fontSize: 16 }}>
                {item.name}
              </Text>
            </View>
            
            {/* ACTION BUTTONS CONTAINER */}
            <View style={styles.actions}>
              <Pressable 
                onPress={() => { setSelectedCleaner({...item}); setEditVisible(true); }}
                style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.5 : 1 }]}
                hitSlop={15} // Makes it easier to tap
              >
                <Feather name="edit-2" size={20} color={c.primary} />
              </Pressable>
              
              <Pressable 
                onPress={() => confirmDelete(item.id, item.name)}
                style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.5 : 1 }]}
                hitSlop={15}
              >
                <Feather name="trash-2" size={20} color={c.destructive} />
              </Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* ADD & EDIT MODALS STAY THE SAME AS PREVIOUS CODE */}
      <Modal visible={isAddVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: c.background, paddingTop: 50 }}>
          <ScreenHeader title="New Staff" leftIcon="x" onLeftPress={() => setAddVisible(false)} />
          <View style={styles.form}>
            <TextInput 
              style={[styles.input, { borderColor: c.border, color: c.foreground }]}
              placeholder="Name"
              value={newName}
              onChangeText={setNewName}
            />
            <Button label="Save" onPress={handleAdd} />
          </View>
        </View>
      </Modal>

      <Modal visible={isEditVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: c.background, paddingTop: 50 }}>
          <ScreenHeader title="Edit Staff" leftIcon="x" onLeftPress={() => setEditVisible(false)} />
          <View style={styles.form}>
            <TextInput 
              style={[styles.input, { borderColor: c.border, color: c.foreground }]}
              value={selectedCleaner?.name}
              onChangeText={(t) => setSelectedCleaner({...selectedCleaner, name: t})}
            />
            <Button label="Update" onPress={handleUpdate} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    flexDirection: 'row', 
    padding: 16, 
    alignItems: 'center',
    minHeight: 70, // Ensures a consistent height for tapping
  },
  actions: { 
    flexDirection: 'row', 
    gap: 20, 
    alignItems: 'center',
    zIndex: 99, // Brings buttons to the front
  },
  iconBtn: { 
    padding: 10, // Larger tap target
  },
  form: { padding: 20, gap: 15 },
  input: { borderWidth: 1, padding: 14, borderRadius: 10, fontSize: 16 }
});