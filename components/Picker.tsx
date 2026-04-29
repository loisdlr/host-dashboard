import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export interface PickerOption {
  value: string;
  label: string;
  color?: string;
}

interface Props {
  label: string;
  value: string;
  options: PickerOption[];
  onChange: (v: string) => void;
}

export function Picker({ label, value, options, onChange }: Props) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <Text
        style={{
          color: c.mutedForeground,
          fontFamily: "Inter_500Medium",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          const accent = opt.color ?? c.primary;
          return (
            <Pressable key={opt.value} onPress={() => onChange(opt.value)}>
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? accent : c.muted,
                    borderColor: active ? accent : c.border,
                    borderRadius: c.radius - 2,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? "#FFFFFF" : c.foreground,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 13,
                  }}
                >
                  {opt.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
