import React from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

/**
 * Cross-platform date input. Uses native date input on web,
 * masked text input on native (YYYY-MM-DD).
 */
export function DateInput({ label, value, onChange }: Props) {
  const c = useColors();

  if (Platform.OS === "web") {
    return (
      <View style={styles.wrap}>
        <Text
          style={{
            color: c.mutedForeground,
            fontFamily: "Inter_500Medium",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
        {/* @ts-ignore - native input on web */}
        <input
          type="date"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            color: c.foreground,
            backgroundColor: c.card,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: c.radius - 2,
            padding: 12,
            fontSize: 15,
            fontFamily: "Inter_500Medium",
            outline: "none",
          } as any}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text
        style={{
          color: c.mutedForeground,
          fontFamily: "Inter_500Medium",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={(t) => {
          // simple mask
          const cleaned = t.replace(/[^0-9-]/g, "").slice(0, 10);
          onChange(cleaned);
        }}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={c.mutedForeground}
        keyboardType="numbers-and-punctuation"
        style={[
          styles.input,
          {
            color: c.foreground,
            backgroundColor: c.card,
            borderColor: c.border,
            borderRadius: c.radius - 2,
            fontFamily: "Inter_500Medium",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, flex: 1 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
});
