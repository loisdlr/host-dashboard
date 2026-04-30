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
    return undefined; // All time
  }, [period]);

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

  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (unitId !== "all") {
      list = list.filter((b) => b.unitId === unitId);
    }
    if (range) {
      list = list.filter((b) => b.checkIn >= range.start && b.checkIn <= range.end);
    }
    return list.sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  }, [bookings, unitId, range]);

  const periodLabel = period === "month" ? "This month" : period === "ytd" ? "Year to date" : "All time";

  // ==================== GENERATE PDF ====================
  const generateIncomePDF = async () => {
    try {
      const unitName = unitId === "all" ? "Portfolio" : units.find((u) => u.id === unitId)?.name || "Unit";

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; padding: 30px; }
              h1 { text-align: center; color: #1f2937; }
              h2 { color: #374151; margin-top: 30px; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f8fafc; }
              .net { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
              .positive { color: #16a34a; }
              .negative { color: #ef4444; }
            </style>
          </head>
          <body>
            <h1>${unitName} Income Report</h1>
            <p style="text-align:center; font-size:16px;">${periodLabel}</p>

            <div class="net ${result.net >= 0 ? 'positive' : 'negative'}">
              Net Profit: ${formatMoney(result.net, settings.currency)}
            </div>

            <h2>Profit Distribution</h2>
            <p><strong>Investor (${settings.investorSharePct}%):</strong> ${formatMoney(result.investorShare, settings.currency)}</p>
            <p><strong>Operator (${settings.operatorSharePct}%):</strong> ${formatMoney(result.operatorShare, settings.currency)}</p>

            <h2>Bookings (${filteredBookings.length})</h2>
            <table>
              <tr><th>Date</th><th>Guest</th><th>Unit</th><th>Amount</th></tr>
              ${filteredBookings.map((b) => `
                <tr>
                  <td>${formatShort(b.checkIn)}</td>
                  <td>${b.guestName || '—'}</td>
                  <td>${units.find(u => u.id === b.unitId)?.name || '—'}</td>
                  <td>${formatMoney(b.totalAmount || 0, settings.currency)}</td>
                </tr>
              `).join("")}
            </table>

            <h2>Expenses (${filteredExpenses.length})</h2>
            <table>
              <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
              ${filteredExpenses.map((e) => `
                <tr>
                  <td>${formatShort(e.date)}</td>
                  <td>${e.description || e.category}</td>
                  <td class="negative">-${formatMoney(e.amount, settings.currency)}</td>
                </tr>
              `).join("")}
            </table>

            <p style="text-align:center; margin-top: 40px; color:#666;">
              Generated on ${new Date().toLocaleDateString()}
            </p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);

      alert("PDF generated successfully!");
    } catch (error: any) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <UnitChip label="All units" active={unitId === "all"} onPress={() => setUnitId("all")} />
          {units.map((u) => (
            <UnitChip key={u.id} label={u.name} active={unitId === u.id} onPress={() => setUnitId(u.id)} />
          ))}
        </ScrollView>

        <Button
          label="Generate Income PDF"
          variant="secondary"
          icon={<Feather name="file-text" size={18} color={c.foreground} />}
          onPress={generateIncomePDF}
          fullWidth
        />

        {/* Net Profit Card */}
        <Card>
          <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Net Profit • {periodLabel}</Text>
          <Text style={[styles.statValue, { color: result.net >= 0 ? c.foreground : c.destructive }]}>
            {formatMoney(result.net, settings.currency)}
          </Text>
        </Card>

        {/* Recent Expenses */}
        <View>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <Button label="Add" size="sm" variant="secondary" onPress={() => router.push("/expense/new")} />
          </View>

          <Card style={{ padding: 0 }}>
            {filteredExpenses.length === 0 ? (
              <EmptyState icon="dollar-sign" title="No expenses" description="No expenses in this period." />
            ) : (
              filteredExpenses.slice(0, 6).map((e, idx) => (
                <View key={e.id} style={[styles.expenseRow, idx > 0 && styles.borderTop]}>
                  <View style={styles.expenseIcon}>
                    <Feather name="tag" size={16} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseDesc}>{e.description || e.category}</Text>
                    <Text style={styles.expenseMeta}>{formatLong(e.date)}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>-{formatMoney(e.amount, settings.currency)}</Text>
                  <TouchableOpacity onPress={() => setSelectedExpense(e)}>
                    <Feather name="edit-2" size={18} color={c.primary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>

      {/* Simple Edit/Delete Modal */}
      <Modal visible={!!selectedExpense} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Options</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                if (selectedExpense) router.push(`/expense/${selectedExpense.id}`);
                setSelectedExpense(null);
              }}
            >
              <Text>Edit Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#fee2e2" }]}
              onPress={() => selectedExpense && handleDelete(selectedExpense.id)}
            >
              <Text style={{ color: "#ef4444" }}>Delete Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedExpense(null)} style={styles.cancelBtn}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 12, textTransform: "uppercase" },
  statValue: { fontSize: 28, fontWeight: "700", marginTop: 4 },
  expenseRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  expenseIcon: { width: 36, height: 36, backgroundColor: "#f1f5f9", borderRadius: 8, alignItems: "center", justifyContent: "center" },
  expenseDesc: { fontWeight: "600" },
  expenseMeta: { fontSize: 12, color: "#64748b" },
  expenseAmount: { color: "#ef4444", fontWeight: "700" },
  borderTop: { borderTopWidth: 1, borderTopColor: "#e2e8f0" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "white", borderRadius: 16, width: "80%", padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  modalBtn: { padding: 16, backgroundColor: "#f8fafc", borderRadius: 12, marginBottom: 8, alignItems: "center" },
  cancelBtn: { padding: 12, alignItems: "center", marginTop: 8 },
});

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
        <Text style={{ color: active ? "white" : c.foreground, fontWeight: "600", fontSize: 12 }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}