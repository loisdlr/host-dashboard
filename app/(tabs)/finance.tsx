import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
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
  formatLong,
  parseISODate,
  todayISO,
  toISODate,
  formatShort,
} from "@/utils/date";
import {
  formatMoney,
  splitForAll,
  splitForUnit,
} from "@/utils/finance";
import type { Expense } from "@/types";

type Period = "month" | "ytd" | "all" | "custom";

export default function FinanceScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { units, bookings, expenses, settings, deleteExpense } = useRental();

  const [unitId, setUnitId] = useState<"all" | string>("all");
  const [period, setPeriod] = useState<Period>("month");
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Calculate date range based on selected period
  const range = useMemo(() => {
    if (period === "custom") {
      return {
        start: toISODate(customStartDate),
        end: toISODate(customEndDate),
      };
    }

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
  }, [period, customStartDate, customEndDate]);

  const result = useMemo(() => {
    if (unitId === "all") return splitForAll(bookings, expenses, settings, range);
    return splitForUnit(unitId, bookings, expenses, settings, range);
  }, [unitId, bookings, expenses, settings, range]);

  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (unitId !== "all") list = list.filter(b => b.unitId === unitId);
    if (range) list = list.filter(b => b.checkIn >= range.start && b.checkIn <= range.end);
    return list.sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  }, [bookings, unitId, range]);

  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (unitId !== "all") list = list.filter(e => e.unitId === unitId || e.unitId === "all");
    if (range) list = list.filter(e => e.date >= range.start && e.date <= range.end);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, unitId, range]);

  const periodLabel = period === "month" ? "This month" 
                    : period === "ytd" ? "Year to date" 
                    : period === "custom" ? "Custom Period" 
                    : "All time";

  // ==================== EXPORT PDF ====================
  const onExportPdf = async () => {
    try {
      const targetUnits = unitId === "all" 
        ? units 
        : units.filter((u) => u.id === unitId);

      if (targetUnits.length === 0) {
        Alert.alert("No unit selected");
        return;
      }

      const unitName = unitId === "all" ? "Portfolio" : targetUnits[0]?.name || "Unit";

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              h1 { text-align: center; color: #1f2937; }
              h2 { color: #374151; margin-top: 30px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f8fafc; }
              .summary { font-size: 20px; font-weight: bold; text-align: center; margin: 25px 0; }
              .positive { color: #16a34a; }
              .negative { color: #ef4444; }
            </style>
          </head>
          <body>
            <h1>${unitName} Income Report</h1>
            <p style="text-align:center; font-size:16px;">Period: ${periodLabel}</p>
            ${range ? `<p style="text-align:center;">${range.start} — ${range.end}</p>` : ''}

            <div class="summary">
              Net Profit: <span class="${result.net >= 0 ? 'positive' : 'negative'}">
                ${formatMoney(result.net, settings.currency)}
              </span>
            </div>

            <h2>Profit Distribution</h2>
            <p><strong>Investor (${settings.investorSharePct}%):</strong> ${formatMoney(result.investorShare, settings.currency)}</p>
            <p><strong>Operator (${settings.operatorSharePct}%):</strong> ${formatMoney(result.operatorShare, settings.currency)}</p>

            <h2>Bookings (${filteredBookings.length})</h2>
            <table>
              <tr><th>Date</th><th>Guest</th><th>Unit</th><th>Amount</th></tr>
              ${filteredBookings.map(b => `
                <tr>
                  <td>${formatShort(b.checkIn)}</td>
                  <td>${b.guestName || '—'}</td>
                  <td>${units.find(u => u.id === b.unitId)?.name || '—'}</td>
                  <td>${formatMoney(b.totalAmount || 0, settings.currency)}</td>
                </tr>
              `).join('')}
            </table>

            <h2>Expenses (${filteredExpenses.length})</h2>
            <table>
              <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
              ${filteredExpenses.map(e => `
                <tr>
                  <td>${formatShort(e.date)}</td>
                  <td>${e.description || e.category}</td>
                  <td class="negative">-${formatMoney(e.amount, settings.currency)}</td>
                </tr>
              `).join('')}
            </table>

            <p style="text-align:center; margin-top: 50px; color:#666;">
              Generated on ${new Date().toLocaleDateString()}
            </p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `${unitName} Report`,
      });

      Alert.alert("Success", "PDF has been generated and ready to share!");
    } catch (error: any) {
      console.error("PDF Export Error:", error);
      Alert.alert("Export Failed", error.message || "Could not generate PDF");
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteExpense(id);
      setSelectedExpense(null);
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120, gap: 16 }}>
        {/* Period Selection */}
        <SegmentedControl
          options={[
            { value: "month", label: "Month" },
            { value: "ytd", label: "YTD" },
            { value: "all", label: "All" },
            { value: "custom", label: "Custom" },
          ]}
          value={period}
          onChange={(v) => setPeriod(v as Period)}
        />

        {/* Custom Date Picker (only shown when Custom is selected) */}
        {period === "custom" && (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity style={styles.dateButton} onPress={() => { /* Add DatePicker logic here if needed */ }}>
              <Text>Start: {formatShort(toISODate(customStartDate))}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateButton} onPress={() => { /* Add DatePicker logic here if needed */ }}>
              <Text>End: {formatShort(toISODate(customEndDate))}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Unit Selection */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <UnitChip label="All units" active={unitId === "all"} onPress={() => setUnitId("all")} />
          {units.map((u) => (
            <UnitChip key={u.id} label={u.name} active={unitId === u.id} onPress={() => setUnitId(u.id)} />
          ))}
        </ScrollView>

        {/* Generate PDF Button */}
        <Button
          label="Generate Income PDF"
          variant="secondary"
          icon={<Feather name="file-text" size={18} color={c.foreground} />}
          onPress={onExportPdf}
          fullWidth
        />

        {/* Your existing cards and expense list can be added here */}
        {/* Net Profit Card, Recent Expenses with Edit button, etc. */}

      </ScrollView>

      {/* Edit / Delete Modal - Keep your existing modal here */}
    </View>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
});