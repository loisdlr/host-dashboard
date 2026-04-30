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
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import DateTimePicker from "@react-native-community/datetimepicker"; // You'll need to install this if not already

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
import type { Expense, Booking } from "@/types";

type Period = "month" | "ytd" | "all" | "custom";

export default function FinanceScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { units, bookings, expenses, settings, deleteExpense } = useRental();

  const [unitId, setUnitId] = useState<"all" | string>("all");
  const [period, setPeriod] = useState<Period>("month");
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  // Calculate date range
  const range = useMemo(() => {
    if (period === "custom") {
      return {
        start: toISODate(customStart),
        end: toISODate(customEnd),
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
  }, [period, customStart, customEnd]);

  const result = useMemo(() => {
    if (unitId === "all") return splitForAll(bookings, expenses, settings, range);
    return splitForUnit(unitId, bookings, expenses, settings, range);
  }, [unitId, bookings, expenses, settings, range]);

  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (unitId !== "all") list = list.filter(b => b.unitId === unitId);
    if (range) {
      list = list.filter(b => b.checkIn >= range.start && b.checkIn <= range.end);
    }
    return list.sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  }, [bookings, unitId, range]);

  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (unitId !== "all") {
      list = list.filter(e => e.unitId === unitId || e.unitId === "all");
    }
    if (range) {
      list = list.filter(e => e.date >= range.start && e.date <= range.end);
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, unitId, range]);

  const periodLabel = period === "month" ? "This month" 
                    : period === "ytd" ? "Year to date" 
                    : period === "custom" ? "Custom Period" 
                    : "All time";

  // ==================== PDF GENERATION ====================
  const generateIncomePDF = async () => {
    try {
      const unitName = unitId === "all" ? "Portfolio" : units.find(u => u.id === unitId)?.name || "Unit";

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              h1, h2 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
              th { background-color: #f0f0f0; }
              .summary { font-size: 18px; font-weight: bold; margin: 20px 0; }
              .positive { color: green; }
              .negative { color: red; }
            </style>
          </head>
          <body>
            <h1>${unitName} Income Statement</h1>
            <p style="text-align:center;">Period: ${periodLabel} (${range?.start} to ${range?.end || 'Present'})</p>

            <div class="summary">
              Net Profit: <span class="${result.net >= 0 ? 'positive' : 'negative'}">
                ${formatMoney(result.net, settings.currency)}
              </span>
            </div>

            <h2>Profit Distribution</h2>
            <p>Investor (${settings.investorSharePct}%): ${formatMoney(result.investorShare, settings.currency)}</p>
            <p>Operator (${settings.operatorSharePct}%): ${formatMoney(result.operatorShare, settings.currency)}</p>

            <h2>Bookings (${filteredBookings.length})</h2>
            <table>
              <tr><th>Guest</th><th>Unit</th><th>Check-in</th><th>Nights</th><th>Total</th></tr>
              ${filteredBookings.map(b => `
                <tr>
                  <td>${b.guestName || 'Guest'}</td>
                  <td>${units.find(u => u.id === b.unitId)?.name || 'N/A'}</td>
                  <td>${formatShort(b.checkIn)}</td>
                  <td>${b.nights || 'N/A'}</td>
                  <td>${formatMoney(b.totalAmount || 0, settings.currency)}</td>
                </tr>
              `).join('')}
            </table>

            <h2>Expenses (${filteredExpenses.length})</h2>
            <table>
              <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr>
              ${filteredExpenses.map(e => `
                <tr>
                  <td>${formatShort(e.date)}</td>
                  <td>${e.description || e.category}</td>
                  <td>${e.category}</td>
                  <td class="negative">-${formatMoney(e.amount, settings.currency)}</td>
                </tr>
              `).join('')}
            </table>

            <p style="text-align:center; margin-top: 40px; color: #666;">
              Generated on ${new Date().toLocaleDateString()}
            </p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${unitName} Income Statement`,
      });

      alert("PDF generated successfully!");
    } catch (error: any) {
      console.error(error);
      alert("Failed to generate PDF: " + (error.message || "Unknown error"));
    }
  };

  // Delete handler (same as before)
  const handleDelete = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    if (window.confirm(`Delete "${expense.description || expense.category}"?`)) {
      deleteExpense(id);
      setSelectedExpense(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title="Finance" subtitle={periodLabel} rightIcon="settings" onRightPress={() => router.push("/settings")} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, gap: 16 }}>
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

        {period === "custom" && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
              <Text>Start: {formatShort(toISODate(customStart))}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
              <Text>End: {formatShort(toISODate(customEnd))}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Unit Selection */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <UnitChip label="All units" active={unitId === "all"} onPress={() => setUnitId("all")} />
          {units.map(u => (
            <UnitChip key={u.id} label={u.name} active={unitId === u.id} onPress={() => setUnitId(u.id)} />
          ))}
        </ScrollView>

        {/* Generate PDF Button */}
        <Button
          label="Generate Income PDF"
          variant="secondary"
          icon={<Feather name="file-text" size={18} color={c.foreground} />}
          onPress={generateIncomePDF}
          fullWidth
        />

        {/* Rest of your cards and expenses list remain similar */}
        {/* ... (Net Profit Card, Profit Distribution, Recent Expenses with Edit button) ... */}

      </ScrollView>

      {/* Edit/Delete Modal - same as previous version */}
      {/* ... keep your modal code here ... */}
    </View>
  );
}