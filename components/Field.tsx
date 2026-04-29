import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface FieldProps extends TextInputProps {
  label: string;
  hint?: string;
}

export function Field({ label, hint, style, ...rest }: FieldProps) {
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
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        placeholderTextColor={c.mutedForeground}
        {...rest}
        style={[
          styles.input,
          {
            color: c.foreground,
            backgroundColor: c.card,
            borderColor: c.border,
            borderRadius: c.radius - 2,
            fontFamily: "Inter_500Medium",
          },
          style,
        ]}
      />
      {hint ? (
        <Text
          style={{
            color: c.mutedForeground,
            fontSize: 11,
            marginTop: 4,
            fontFamily: "Inter_400Regular",
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
});
