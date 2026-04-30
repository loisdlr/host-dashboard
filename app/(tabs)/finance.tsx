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

  const recentExpenses = useMemo(() => {
    let list = [...expenses];
    if (unitId !== "all") {
      list = list.filter((e) => e.unitId === unitId || e.unitId === "all");
    }
    if (range) {
      list = list.filter((e) => e.date >= range.start && e.date <= range.end);
    }
    return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  }, [expenses, unitId, range]);

  const periodLabel = period === "month" ? "This month" : period === "ytd" ? "Year to date" : "All time";

  // ==================== PDF GENERATION ====================
  const generateAndExportPDF = async () => {
    try {
      const targetUnits = unitId === "all" 
        ? units 
        : units.filter((u) => u.id === unitId);

      if (targetUnits.length === 0) {
        alert("No units available to export.");
        return;
      }

      // Simple HTML template (you can make this much nicer later)
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>${unitId === "all" ? "Portfolio" : targetUnits[0]?.name} Financial Statement</h1>
            <p><strong>Period:</strong> ${periodLabel}</p>
            <p><strong>Net Profit:</strong> ${formatMoney(result.net, settings.currency)}</p>
            
            <h2>Gross Income: ${formatMoney(result.gross, settings.currency)}</h2>
            <h2>Expenses: -${formatMoney(result.expenses, settings.currency)}</h2>
            
            <h3>Recent Expenses</h3>
            <table>
              <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
              ${recentExpenses.map(e => `
                <tr>
                  <td>${formatLong(e.date)}</td>
                  <td>${e.description || e.category}</td>
                  <td>-${formatMoney(e.amount, settings.currency)}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Share ${unitId === "all" ? "Portfolio" : "Unit"} Statement`,
        UTI: "com.adobe.pdf",
      });

      alert("PDF generated and ready to share!");
    } catch (error: any) {
      console.error("PDF Error:", error);
      alert(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    }
  };

  // Delete handler
  const handleDelete = (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;

    const confirmed = window.confirm(
      `Delete this expense?\n\n${expense.description || expense.category}\nAmount: ${formatMoney(expense.amount, settings.currency)}`
    );

    if (confirmed) {
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110, gap: 16 }}>
        {/* Period & Unit Filters */}
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

        {/* Export Button - Now Functional */}
        <Button
          label={unitId === "all" ? "Export Portfolio PDF" : `Export ${units.find((u) => u.id === unitId)?.name ?? "Unit"} PDF`}
          variant="secondary"
          icon={<Feather name="file-text" size={16} color={c.foreground} />}
          onPress={generateAndExportPDF}
          fullWidth
        />

        {/* Net Profit & Other Cards - (kept the same as before) */}
        {/* ... Your existing Net Profit Card and Profit Distribution Card ... */}

        {/* Recent Expenses with Edit Button */}
        <View>
          <View style={[styles.rowBetween, { marginBottom: 12 }]}>
            <Text style={styles.sectionTitle}>Recent expenses</Text>
            <Button
              label="Add"
              size="sm"
              variant="secondary"
              icon={<Feather name="plus" size={14} color={c.foreground} />}
              onPress={() => router.push("/expense/new")}
            />
          </View>

          <Card style={{ padding: 0, overflow: "hidden" }}>
            {recentExpenses.length === 0 ? (
              <EmptyState icon="dollar-sign" title="No expenses yet" description="Track repairs and bills here." />
            ) : (
              recentExpenses.map((e, idx) => (
                <View key={e.id} style={[styles.expenseRow, idx !== 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                  <View style={styles.expenseIcon}>
                    <Feather name="tag" size={16} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseDesc}>{e.description || e.category}</Text>
                    <Text style={styles.expenseMeta}>
                      {e.category} · {units.find((u) => u.id === e.unitId)?.name ?? "All Units"} · {formatLong(e.date)}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>-{formatMoney(e.amount, settings.currency)}</Text>

                  <TouchableOpacity onPress={() => setSelectedExpense(e)} style={styles.editButton}>
                    <Feather name="edit-2" size={18} color={c.primary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>

      {/* Edit / Delete Modal */}
      <Modal visible={!!selectedExpense} transparent animationType="fade" onRequestClose={() => setSelectedExpense(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Expense Options</Text>
            <Text style={styles.modalSubtitle}>
              {selectedExpense?.description || selectedExpense?.category}
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                if (selectedExpense) router.push(`/expense/${selectedExpense.id}`);
                setSelectedExpense(null);
              }}
            >
              <Feather name="edit-2" size={20} color={c.primary} />
              <Text style={styles.modalButtonText}>Edit Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#fff5f5" }]}
              onPress={() => selectedExpense && handleDelete(selectedExpense.id)}
            >
              <Feather name="trash-2" size={20} color="#ef4444" />
              <Text style={{ color: "#ef4444", fontWeight: "600", fontSize: 16 }}>Delete Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedExpense(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ==================== Styles & Helpers (same as before) ==================== */
const styles = StyleSheet.create({
  // ... (copy all styles from previous version)
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  expenseRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  expenseIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  expenseDesc: { fontWeight: "600", fontSize: 14.5 },
  expenseMeta: { color: "#6b7280", fontSize: 11.5, marginTop: 2 },
  expenseAmount: { color: "#ef4444", fontWeight: "700", fontSize: 15.5 },
  editButton: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "white", borderRadius: 16, width: "85%", padding: 20, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 },
  modalButton: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%", padding: 16, borderRadius: 12, marginBottom: 10, backgroundColor: "#f8f9fa" },
  modalButtonText: { fontSize: 16, fontWeight: "600" },
  cancelButton: { marginTop: 10, padding: 12 },
  cancelText: { color: "#666", fontSize: 16 },
});

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const c = useColors();
  return (
    <View style={styles.rowBetween}>
      <Text style={{ color: c.mutedForeground, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: valueColor ?? c.foreground, fontWeight: "700", fontSize: 15 }}>{value}</Text>
    </View>
  );
}

// Add SplitBar and UnitChip similarly (from previous versions)