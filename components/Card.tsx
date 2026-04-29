import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import { useColors } from "@/hooks/useColors";

export function Card({ style, children, ...rest }: ViewProps) {
  const c = useColors();
  return (
    <View
      {...rest}
      style={[
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          borderRadius: c.radius,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
});
