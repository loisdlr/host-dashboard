import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import React, { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet } from 'react-native';

export default function CleanersScreen() {
  const [selectedCleaner, setSelectedCleaner] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const openEdit = (cleaner) => {
    setSelectedCleaner(cleaner);
    setShowEditForm(true);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Your List of Cleaners */}
      {/* In your renderItem, change the onPress: */}
      {/* onPress={() => openEdit(item)} */}

      {/* --- THE EDIT FORM --- */}
      {showEditForm && (
        <View style={styles.inlineForm}>
          <Text style={styles.formTitle}>Edit Cleaner: {selectedCleaner?.name}</Text>
          <TextInput 
            style={styles.input}
            defaultValue={selectedCleaner?.name}
            placeholder="Cleaner Name"
          />
          <Button label="Save Changes" onPress={() => setShowEditForm(false)} />
          <Button label="Cancel" variant="secondary" onPress={() => setShowEditForm(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inlineForm: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    // Position this at the bottom or as a modal
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginVertical: 10
  }
});

export default function CleanersScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cleaners, deleteCleaner } = useRental();

  const confirmDelete = (id: string, name: string, swipeable: SwipeableMethods) => {
    Alert.alert(
      "Remove Cleaner",
      `Are you sure you want to remove ${name}?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => swipeable.close() },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => {
            deleteCleaner(id);
            swipeable.close();
          } 
        },
      ]
    );
  };

  const renderRightActions = (
    prog: SharedValue<number>,
    drag: SharedValue<number>,
    swipeable: SwipeableMethods,
    id: string,
    name: string
  ) => {
    const styleAnimation = useAnimatedStyle(() => ({
      transform: [{ translateX: drag.value + 80 }],
    }));

    return (
      <Reanimated.View style={styleAnimation}>
        <Pressable
          onPress={() => confirmDelete(id, name, swipeable)}
          style={[styles.deleteAction, { backgroundColor: c.destructive }]}
        >
          <Feather name="trash-2" size={20} color="white" />
        </Pressable>
      </Reanimated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Cleaners"
        subtitle={`${cleaners.length} active personnel`}
        rightIcon="plus"
        onRightPress={() => router.push("/cleaner/new")}
      />

      <FlatList
        data={cleaners}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 20,
          gap: 12,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="user-plus"
            title="No cleaners found"
            description="Add your first cleaner to start assigning tasks."
          />
        }
        renderItem={({ item }) => (
  <ReanimatedSwipeable
    // ... swipeable props
  >
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Pressable
        onPress={() => router.push({
          pathname: "/cleaner/[id]",
          params: { id: item.id }
        })}
        style={({ pressed }) => [
          styles.cleanerRow,
          { backgroundColor: pressed ? c.accent : c.card }
        ]}
      >
        {/* Cleaner Row Content (Avatar, Name, etc.) */}
        <View style={[styles.avatar, { backgroundColor: c.muted }]}>
           <Text style={{ color: c.foreground }}>{item.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
           <Text style={styles.nameText}>{item.name}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={c.mutedForeground} />
      </Pressable>
    </Card>
  </ReanimatedSwipeable>
)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cleanerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteAction: {
    width: 80,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 12, // Matches Card radius
    borderBottomRightRadius: 12,
  },
});