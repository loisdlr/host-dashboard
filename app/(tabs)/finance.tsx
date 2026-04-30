import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
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
  formatLong,
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
  const { units, bookings, expenses, settings, deleteExpense } = useRental();

  const [unitId, setUnitId] = useState<"all" | string>("all");
  const [period, setPeriod] = useState<Period>("month");

  // Date Range
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

  // Calculations
  const result = useMemo(() => {
    if (unitId === "all") return splitForAll(bookings, expenses, settings, range);
    return splitForUnit(unitId, bookings, expenses, settings, range);
  }, [unitId, bookings, expenses, settings, range]);

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

  // ==================== PDF EXPORT ====================
  const onExportPdf = async () => {
    try {
      const targetUnits = unitId === "all" ? units : units.filter((u) => u.id === unitId);

      if (targetUnits.length === 0) {
        Alert.alert("No unit selected");
        return;
      }

      const unitName = unitId === "all" ? "Portfolio" : targetUnits[0]?.name || "Unit";

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 30px; }
              h1 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; }
              th { background-color: #f0f0f0; }
            </style>
          </head>
          <body>
            <h1>${unitName} Financial Report</h1>
            <p style="text-align:center;">${periodLabel}</p>
            
            <h2>Net Profit: ${formatMoney(result.net, settings.currency)}</h2>
            
            <h2>Profit Distribution</h2>
            <p>Investor (${settings.investorSharePct}%): ${formatMoney(result.investorShare, settings.currency)}</p>
            <p>Operator (${settings.operatorSharePct}%): ${formatMoney(result.operatorShare, settings.currency)}</p>

            <h2>Expenses (${filteredExpenses.length})</h2>
            <table>
              <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
              ${filteredExpenses.map(e => `
                <tr>
                  <td>${formatShort(e.date)}</td>
                  <td>${e.description || e.category}</td>
                  <td>-${formatMoney(e.amount, settings.currency)}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);

      Alert.alert("Success", "PDF generated successfully!");
    } catch (error: any) {
      console.error("PDF Error:", error);
      Alert.alert("Export Failed", error.message || "Could not generate PDF");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Finance"
        subtitle={periodLabel}
        rightIcon="settings"
        onRightPress={() => router.push("/settings")}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, gap: 16 }}>
        <SegmentedControl
          options={[
            { value: "month", label: "Month" },
            { value: "ytd", label: "YTD" },
            { value: "all", label: "All" },
          ]}
          value={period}
          onChange={(v) => setPeriod(v as Period)}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle