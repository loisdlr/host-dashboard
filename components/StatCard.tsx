import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "./Card";
import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  icon?: React.ReactNode;
  compact?: boolean;
}

export function StatCard({
  label,
  value,
  hint,
  accent,
  icon,
  compact,
}: StatCardProps) {
  const c = useColors();
  return (
    <Card
      style={[
        styles.card,
        compact ? { padding: 14 } : null,
      ]}
    >
      <View style={styles.row}>
        <Text
          style={{
            color: c.mutedForeground,
            fontSize: 12,
            fontFamily: "Inter_500Medium",
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          {label}
        </Text>
        {icon ? <View>{icon}</View> : null}
      </View>
      <Text
        style={{
          color: accent ?? c.foreground,
          fontSize: compact ? 22 : 26,
          fontFamily: "Inter_700Bold",
          marginTop: 6,
        }}
      >
        {value}
      </Text>
      {hint ? (
        <Text
          style={{
            color: c.mutedForeground,
            fontSize: 12,
            fontFamily: "Inter_400Regular",
            marginTop: 4,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
