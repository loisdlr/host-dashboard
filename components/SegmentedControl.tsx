import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const c = useColors();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.muted, borderRadius: c.radius },
      ]}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              styles.option,
              {
                backgroundColor: active ? c.card : "transparent",
                borderRadius: c.radius - 4,
              },
            ]}
          >
            <Text
              style={{
                color: active ? c.foreground : c.mutedForeground,
                fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium",
                fontSize: 13,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 4,
  },
  option: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});
