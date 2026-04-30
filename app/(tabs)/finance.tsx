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

type Period = "month" | "ytd" | "all";

export default function FinanceScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { units, bookings, expenses, settings, deleteExpense } = useRental();

  const [unitId, setUnitId] = useState<"all" | string>("all");
  const [period, setPeriod] = useState<Period>("month");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

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
    return undefined;
  }, [period]);

  const result = useMemo(() => {
    if (unitId === "all") return splitForAll(bookings, expenses, settings, range);
    return splitForUnit(unitId, bookings, expenses, settings, range);
  }, [unitId, bookings, expenses, settings, range]);

  // Filter Bookings (Income) for PDF
  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (unitId !== "all") list = list.filter((b) => b.unitId === unitId);
    if (range) list = list.filter((b) => b.checkIn >= range.start && b.checkIn <= range.end);
    return list.sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  }, [bookings, unitId, range]);

  // Filter Expenses for the List and PDF
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (unitId !== "all") list = list.filter((e) => e.unitId === unitId || e.unitId === "all");
    if (range) list = list.filter((e) => e.date >= range.start && e.date <= range.end);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, unitId, range]);

  const periodLabel = period === "month" ? "This month" : period === "ytd" ? "Year to date" : "All time";

  // ==================== ENHANCED PDF GENERATION ====================
  const generateAndExportPDF = async () => {
    try {
      const unitName = unitId === "all" ? "Portfolio" : units.find(u => u.id === unitId)?.name || "Unit";
      const currency = settings.currency;

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              h1 { text-align: center; margin-bottom: 5px; }
              .period { text-align: center; color: #666; margin-bottom: 30px; }
              .summary-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
              .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 16px; }
              .total { font-size: 20px; font-weight: bold; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
              td { border: 1px solid #e2e8f0; padding: 10px; }
              .income { color: #10b981; }
              .expense { color: #ef4444; }
              h3 { margin-top: 40px; border-bottom: 2px solid #333; padding-bottom: 5px; }
            </style>
          </head>
          <body>
            <h1>${unitName} Financial Report</h1>
            <p class="period">${periodLabel} (${range ? `${formatShort(range.start)} - ${formatShort(range.end)}` : 'All Time'})</p>
            
            <div class="summary-box">
              <div class="summary-row"><span>Gross Income:</span><span>${formatMoney(result.gross, currency)}</span></div>
              <div class="summary-row"><span>Total Expenses:</span><span class="expense">-${formatMoney(result.expenses, currency)}</span></div>
              <div class="summary-row total"><span>Net Profit:</span><span>${formatMoney(result.net, currency)}</span></div>
              <div class="summary-row" style="margin-top:20px;"><span>Investor Share (${settings.investorSharePct}%):</span><span>${formatMoney(result.investorShare, currency)}</span></div>
              <div class="summary-row"><span>Operator Share (${settings.operatorSharePct}%):</span><span>${formatMoney(result.operatorShare, currency)}</span></div>
            </div>

            <h3>Income (Bookings)</h3>
            <table>
              <tr><th>Date</th><th>Guest / Unit</th><th>Amount</th></tr>
              ${filteredBookings.map(b => `
                <tr>
                  <td>${formatShort(b.checkIn)}</td>
                  <td>${b.guestName} (${units.find(u => u.id === b.unitId)?.name || 'Unit'})</td>
                  <td class="income">${formatMoney(b.totalPrice, currency)}</td>
                </tr>
              `).join('')}
            </table>

            <h3>Expenses</h3>
            <table>
              <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
              ${filteredExpenses.map(e => `
                <tr>
                  <td>${formatShort(e.date)}</td>
                  <td>${e.description || e.category}</td>
                  <td class="expense">-${formatMoney(e.amount, currency)}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error: any) {
      Alert.alert("Export Failed", error.message);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Delete this expense?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteExpense(id); setSelectedExpense(null); } }
    ]);
  };

  if (!settings) return null;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Finance"
        subtitle={periodLabel}
        rightIcon="settings"
        onRightPress={() => router.push("/settings")}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110, gap: 16 }}>
        <SegmentedControl
          options={[{ value: "month", label: "Month" }, { value: "ytd", label: "YTD" }, { value: "all", label: "All" }]}
          value={period}
          onChange={(v) => setPeriod(v as Period)}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <UnitChip label="All units" active={unitId === "all"} onPress={() => setUnitId("all")} />
          {units.map((u) => (
            <UnitChip key={u.id} label={u.name} active={unitId === u.id} onPress={() => setUnitId(u.id)} />
          ))}
        </ScrollView>

        <Button
          label="Generate Financial PDF"
          variant="secondary"
          icon={<Feather name="file-text" size={18} color={c.foreground} />}
          onPress={generateAndExportPDF}
          fullWidth
        />

        <Card>
          <Text style={{ fontSize: 13, color: c.mutedForeground, marginBottom: 4 }}>Net Profit</Text>
          <Text style={{ fontSize: 32, fontWeight: "800", color: result.net >= 0 ? c.foreground : c.destructive }}>
            {formatMoney(result.net, settings.currency)}
          </Text>
          <SplitBar 
            investor={result.investorShare} 
            operator={result.operatorShare} 
            investorPct={settings.investorSharePct}
            operatorPct={settings.operatorSharePct}
            currency={settings.currency}
          />
        </Card>

        <View>
          <View style={[styles.rowBetween, { marginBottom: 12 }]}>
            <Text style={styles.sectionTitle}>Recent expenses</Text>
            <Button
              label="Add" size="sm" variant="secondary"
              icon={<Feather name="plus" size={14} color={c.foreground} />}
              onPress={() => router.push("/expense/new")}
            />
          </View>

          <Card style={{ padding: 0, overflow: "hidden" }}>
            {filteredExpenses.length === 0 ? (
              <EmptyState icon="dollar-sign" title="No expenses" description="No data for this period." />
            ) : (
              filteredExpenses.slice(0, 8).map((e, idx) => (
                <View key={e.id} style={[styles.expenseRow, idx !== 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseDesc}>{e.description || e.category}</Text>
                    <Text style={styles.expenseMeta}>{formatLong(e.date)} · {e.category}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>-{formatMoney(e.amount, settings.currency)}</Text>
                  <TouchableOpacity onPress={() => setSelectedExpense(e)} style={{ paddingLeft: 10 }}>
                    <Feather name="edit-2" size={16} color={c.primary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>

      <Modal visible={!!selectedExpense} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Options</Text>
            <Button label="Edit" onPress={() => { router.push(`/expense/${selectedExpense?.id}`); setSelectedExpense(null); }} fullWidth />
            <View style={{ height: 10 }} />
            <Button label="Delete" variant="destructive" onPress={() => selectedExpense && handleDelete(selectedExpense.id)} fullWidth />
            <TouchableOpacity onPress={() => setSelectedExpense(null)} style={{ marginTop: 20 }}><Text>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==================== SUB-COMPONENTS ====================

function UnitChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: active ? c.primary : c.muted }]}>
      <Text style={{ color: active ? "white" : c.foreground, fontWeight: "600", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

function SplitBar({ investor, operator, investorPct, operatorPct, currency }: any) {
  const c = useColors();
  return (
    <View style={{ marginTop: 20 }}>
      <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#eee' }}>
        <View style={{ flex: investorPct, backgroundColor: c.primary }} />
        <View style={{ flex: operatorPct, backgroundColor: '#94a3b8' }} />
      </View>
      <View style={[styles.rowBetween, { marginTop: 8 }]}>
        <Text style={{ fontSize: 12, color: c.mutedForeground }}>Investor: {formatMoney(investor, currency)}</Text>
        <Text style={{ fontSize: 12, color: c.mutedForeground }}>Operator: {formatMoney(operator, currency)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  expenseRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  expenseDesc: { fontWeight: "600", fontSize: 14 },
  expenseMeta: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  expenseAmount: { color: "#ef4444", fontWeight: "700", fontSize: 14 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "white", borderRadius: 16, padding: 20, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 20 },
});