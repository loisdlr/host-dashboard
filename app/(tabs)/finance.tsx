import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import {
  formatMoney,
  splitForAll,
  splitForUnit,
} from "@/utils/finance";
import {
  parseISODate,
  todayISO,
  toISODate,
  formatShort,
} from "@/utils/date";

type Period = "month" | "ytd" | "all";

export default function FinanceScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { units, bookings, expenses, settings } = useRental();

  const [unitId, setUnitId] = useState<"all" | string>("all");
  const [period, setPeriod] = useState<Period>("month");

  // Calculate Date Range
  const range = useMemo(() => {
    const now = parseISODate(todayISO());
    if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: toISODate(start), end: toISODate(end) };
    }
    if (period === "ytd") {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start: toISODate(start), end: toISODate(now) };
    }
    return undefined; // All time
  }, [period]);

  // Calculate Financial Results
  const result = useMemo(() => {
    if (!settings) return { net: 0, investorShare: 0, operatorShare: 0 };
    if (unitId === "all") return splitForAll(bookings, expenses, settings, range);
    return splitForUnit(unitId, bookings, expenses, settings, range);
  }, [unitId, bookings, expenses, settings, range]);

  // Filter Expenses for the List
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (unitId !== "all") {
      list = list.filter((e) => e.unitId === unitId || e.unitId === "all");
    }
    if (range) {
      list = list.filter((e) => e.date >= range.start && e.date <= range.end);
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, unitId, range]);

  const periodLabel = period === "month" ? "This month" : period === "ytd" ? "Year to date" : "All time";

  // PDF EXPORT LOGIC
  const onExportPdf = async () => {
    try {
      const targetUnits = unitId === "all" ? units : units.filter((u) => u.id === unitId);
      if (targetUnits.length === 0 && unitId !== "all") {
        Alert.alert("Error", "No unit selected");
        return;
      }

      const unitName = unitId === "all" ? "Portfolio" : targetUnits[0]?.name || "Unit";

      const html = `
        <html>
          <head>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; }
              h1 { text-align: center; color: #000; }
              .summary { margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #eee; padding: 12px; text-align: left; }
              th { background-color: #f4f4f4; }
              .negative { color: #ef4444; }
            </style>
          </head>
          <body>
            <h1>${unitName} Report</h1>
            <p style="text-align:center;">${periodLabel}</p>
            <div class="summary">
              <h2>Net Profit: ${formatMoney(result.net, settings?.currency || "USD")}</h2>
              <p>Investor Share: ${formatMoney(result.investorShare, settings?.currency || "USD")}</p>
              <p>Operator Share: ${formatMoney(result.operatorShare, settings?.currency || "USD")}</p>
            </div>
            <table>
              <thead>
                <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
              </thead>
              <tbody>
                ${filteredExpenses.map(e => `
                  <tr>
                    <td>${formatShort(e.date)}</td>
                    <td>${e.description || e.category}</td>
                    <td class="negative">-${formatMoney(e.amount, settings?.currency || "USD")}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error: any) {
      Alert.alert("Export Failed", error.message || "Could not generate PDF");
    }
  };

  // Guard against missing settings
  if (!settings) return null;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Finance"
        subtitle={periodLabel}
        rightIcon="settings"
        onRightPress={() => router.push("/settings")}
      />

      <ScrollView 
        contentContainerStyle={{ 
          padding: 16, 
          paddingBottom: insets.bottom + 100, 
          gap: 16 
        }}
      >
        <SegmentedControl
          options={[
            { value: "month", label: "Month" },
            { value: "ytd", label: "YTD" },
            { value: "all", label: "All" },
          ]}
          value={period}
          onChange={(v) => setPeriod(v as Period)}
        />

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ gap: 8 }}
        >
          <UnitChip label="All units" active={unitId === "all"} onPress={() => setUnitId("all")} />
          {units.map((u) => (
            <UnitChip 
              key={u.id} 
              label={u.name} 
              active={unitId === u.id} 
              onPress={() => setUnitId(u.id)} 
            />
          ))}
        </ScrollView>

        <Button
          label="Generate Income PDF"
          variant="secondary"
          icon={<Feather name="file-text" size={18} color={c.foreground} />}
          onPress={onExportPdf}
          fullWidth
        />

        <Card>
          <Text style={{ fontSize: 13, color: c.mutedForeground }}>Net Profit • {periodLabel}</Text>
          <Text style={{ fontSize: 28, fontWeight: "700", marginTop: 8, color: result.net >= 0 ? c.foreground : c.destructive }}>
            {formatMoney(result.net, settings.currency)}
          </Text>
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>Recent Expenses</Text>
          {filteredExpenses.length === 0 ? (
            <EmptyState 
              icon="dollar-sign" 
              title="No expenses" 
              description="No expenses found in this period." 
            />
          ) : (
            filteredExpenses.slice(0, 6).map((e) => (
              <View key={e.id} style={styles.expenseItem}>
                <Text style={{ flex: 1, color: c.foreground }}>{e.description || e.category}</Text>
                <Text style={{ color: "#ef4444", fontWeight: "600" }}>
                  -{formatMoney(e.amount, settings.currency)}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

function UnitChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress}>
      <View style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: active ? c.primary : c.muted,
      }}>
        <Text style={{ 
          color: active ? "white" : c.foreground, 
          fontWeight: "600", 
          fontSize: 12 
        }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});