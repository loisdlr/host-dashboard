import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

// ─── UnitChip ────────────────────────────────────────────────────────────────
function UnitChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? c.primary : c.card,
          borderColor: active ? c.primary : c.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? "#fff" : c.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────
function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const c = useColors();
  return (
    <View style={styles.rowBetween}>
      <Text style={{ color: c.mutedForeground, fontSize: 13 }}>{label}</Text>
      <Text
        style={{
          color: valueColor ?? c.foreground,
          fontWeight: "700",
          fontSize: 15,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── SplitBar ────────────────────────────────────────────────────────────────
function SplitBar({
  gross,
  expensesTotal,
  currency,
}: {
  gross: number;
  expensesTotal: number;
  currency: string;
}) {
  const total = gross + expensesTotal;
  const grossPct = total > 0 ? (gross / total) * 100 : 50;

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.splitBarTrack}>
        <View
          style={[
            styles.splitBarFill,
            { width: `${grossPct}%`, backgroundColor: "#22c55e" },
          ]}
        />
        <View
          style={[
            styles.splitBarFill,
            {
              width: `${100 - grossPct}%`,
              backgroundColor: "#ef4444",
              borderTopRightRadius: 6,
              borderBottomRightRadius: 6,
            },
          ]}
        />
      </View>
      <View style={styles.rowBetween}>
        <Text style={{ fontSize: 11, color: "#22c55e", fontWeight: "600" }}>
          Income {Math.round(grossPct)}%
        </Text>
        <Text style={{ fontSize: 11, color: "#ef4444", fontWeight: "600" }}>
          Expenses {Math.round(100 - grossPct)}%
        </Text>
      </View>
    </View>
  );
}

// ─── FinanceScreen ────────────────────────────────────────────────────────────
export default function FinanceScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { units, bookings, expenses, settings, deleteExpense } = useRental();

  const [unitId, setUnitId] = useState<"all" | string>("all");
  const [period, setPeriod] = useState<Period>("month");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // ── Date range ──────────────────────────────────────────────────────────────
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

  // ── Financial result ────────────────────────────────────────────────────────
  const result = useMemo(() => {
    if (unitId === "all")
      return splitForAll(bookings, expenses, settings, range);
    return splitForUnit(unitId, bookings, expenses, settings, range);
  }, [unitId, bookings, expenses, settings, range]);

  // ── Recent expenses ─────────────────────────────────────────────────────────
  const recentExpenses = useMemo(() => {
    let list = [...expenses];
    if (unitId !== "all") {
      list = list.filter(
        (e) => e.unitId === unitId || e.unitId === "all"
      );
    }
    if (range) {
      list = list.filter(
        (e) => e.date >= range.start && e.date <= range.end
      );
    }
    return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  }, [expenses, unitId, range]);

  const periodLabel =
    period === "month"
      ? "This month"
      : period === "ytd"
      ? "Year to date"
      : "All time";

  const netColor =
    result.net >= 0 ? "#22c55e" : "#ef4444";

  // ── PDF export ──────────────────────────────────────────────────────────────
  const generateAndExportPDF = async () => {
    try {
      const targetUnits =
        unitId === "all"
          ? units
          : units.filter((u) => u.id === unitId);

      if (targetUnits.length === 0) {
        Alert.alert("Export Error", "No units available to export.");
        return;
      }

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
              h1 { text-align: center; margin-bottom: 4px; }
              .subtitle { text-align: center; color: #666; margin-bottom: 24px; }
              .summary { display: flex; gap: 12px; margin-bottom: 24px; }
              .summary-card { flex: 1; padding: 16px; border-radius: 8px; background: #f9fafb; border: 1px solid #e5e7eb; }
              .summary-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
              .summary-value { font-size: 20px; font-weight: 700; }
              .green { color: #16a34a; }
              .red { color: #dc2626; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 13px; }
              th { background: #f3f4f6; font-weight: 600; }
              tr:nth-child(even) td { background: #f9fafb; }
            </style>
          </head>
          <body>
            <h1>${unitId === "all" ? "Portfolio" : targetUnits[0]?.name} Financial Statement</h1>
            <p class="subtitle">${periodLabel}</p>

            <div class="summary">
              <div class="summary-card">
                <div class="summary-label">Net Profit</div>
                <div class="summary-value ${result.net >= 0 ? "green" : "red"}">${formatMoney(result.net, settings.currency)}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Gross Income</div>
                <div class="summary-value green">${formatMoney(result.gross, settings.currency)}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Total Expenses</div>
                <div class="summary-value red">-${formatMoney(result.expenses, settings.currency)}</div>
              </div>
            </div>

            <h3>Recent Expenses</h3>
            <table>
              <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr>
              ${
                recentExpenses.length === 0
                  ? `<tr><td colspan="4" style="text-align:center;color:#9ca3af;">No expenses in this period</td></tr>`
                  : recentExpenses
                      .map(
                        (e) => `
                <tr>
                  <td>${formatLong(e.date)}</td>
                  <td>${e.category}</td>
                  <td>${e.description || "—"}</td>
                  <td style="color:#dc2626;font-weight:600;">-${formatMoney(e.amount, settings.currency)}</td>
                </tr>`
                      )
                      .join("")
              }
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Share ${unitId === "all" ? "Portfolio" : "Unit"} Statement`,
        UTI: "com.adobe.pdf",
      });
    } catch (error: any) {
      console.error("PDF Error:", error);
      Alert.alert(
        "Export Failed",
        error?.message ?? "An unknown error occurred."
      );
    }
  };

  // ── Delete expense ──────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;

    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete this expense?\n\n${
        expense.description || expense.category
      }\nAmount: ${formatMoney(expense.amount, settings.currency)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteExpense(id);
            setSelectedExpense(null);
          },
        },
      ]
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
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
          paddingBottom: insets.bottom + 110,
          gap: 16,
        }}
      >
        {/* Period filter */}
        <SegmentedControl
          options={[
            { value: "month", label: "Month" },
            { value: "ytd", label: "YTD" },
            { value: "all", label: "All" },
          ]}
          value={period}
          onChange={(v) => setPeriod(v as Period)}
        />

        {/* Unit filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          <UnitChip
            label="All units"
            active={unitId === "all"}
            onPress={() => setUnitId("all")}
          />
          {units.map((u) => (
            <UnitChip
              key={u.id}
              label={u.name}
              active={unitId === u.id}
              onPress={() => setUnitId(u.id)}
            />
          ))}
        </ScrollView>

        {/* Export PDF Button */}
        <Button
          label={
            unitId === "all"
              ? "Export Portfolio PDF"
              : `Export ${
                  units.find((u) => u.id === unitId)?.name ?? "Unit"
                } PDF`
          }
          variant="secondary"
          icon={<Feather name="file-text" size={16} color={c.foreground} />}
          onPress={generateAndExportPDF}
          fullWidth
        />

        {/* ── Net Profit Card ── */}
        <Card style={{ padding: 20, gap: 16 }}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>
            Summary
          </Text>
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <Text style={{ fontSize: 12, color: c.mutedForeground, marginBottom: 4 }}>
              Net Profit
            </Text>
            <Text style={{ fontSize: 36, fontWeight: "800", color: netColor }}>
              {formatMoney(result.net, settings.currency)}
            </Text>
          </View>
          <SplitBar
            gross={result.gross}
            expensesTotal={result.expenses}
            currency={settings.currency}
          />
          <View style={{ gap: 10 }}>
            <Row
              label="Gross Income"
              value={formatMoney(result.gross, settings.currency)}
              valueColor="#22c55e"
            />
            <Row
              label="Total Expenses"
              value={`-${formatMoney(result.expenses, settings.currency)}`}
              valueColor="#ef4444"
            />
          </View>
        </Card>

        {/* ── Recent Expenses ── */}
        <View>
          <View style={[styles.rowBetween, { marginBottom: 12 }]}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>
              Recent expenses
            </Text>
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
              <EmptyState
                icon="dollar-sign"
                title="No expenses yet"
                description="Track repairs and bills here."
              />
            ) : (
              recentExpenses.map((e, idx) => (
                <View
                  key={e.id}
                  style={[
                    styles.expenseRow,
                    idx !== 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: c.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.expenseIcon,
                      { backgroundColor: c.card },
                    ]}
                  >
                    <Feather name="tag" size={16} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.expenseDesc, { color: c.foreground }]}>
                      {e.description || e.category}
                    </Text>
                    <Text style={styles.expenseMeta}>
                      {e.category} ·{" "}
                      {units.find((u) => u.id === e.unitId)?.name ??
                        "All Units"}{" "}
                      · {formatLong(e.date)}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>
                    -{formatMoney(e.amount, settings.currency)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedExpense(e)}
                    style={styles.editButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="edit-2" size={18} color={c.primary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>

      {/* ── Edit / Delete Modal ── */}
      <Modal
        visible={!!selectedExpense}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedExpense(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedExpense(null)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Expense Options</Text>
            <Text style={styles.modalSubtitle}>
              {selectedExpense?.description || selectedExpense?.category}
            </Text>

            {/* Edit */}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                if (selectedExpense)
                  router.push(`/expense/${selectedExpense.id}`);
                setSelectedExpense(null);
              }}
              activeOpacity={0.7}
            >
              <Feather name="edit-2" size={20} color="#3b82f6" />
              <Text style={styles.modalButtonText}>Edit Expense</Text>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonDanger]}
              onPress={() =>
                selectedExpense && handleDelete(selectedExpense.id)
              }
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={20} color="#ef4444" />
              <Text style={[styles.modalButtonText, { color: "#ef4444" }]}>
                Delete Expense
              </Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSelectedExpense(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  expenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseDesc: {
    fontWeight: "600",
    fontSize: 14.5,
  },
  expenseMeta: {
    color: "#6b7280",
    fontSize: 11.5,
    marginTop: 2,
  },
  expenseAmount: {
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 15.5,
  },
  editButton: {
    padding: 4,
  },
  splitBarTrack: {
    flexDirection: "row",
    height: 10,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  splitBarFill: {
    height: "100%",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "85%",
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#f8f9fa",
  },
  modalButtonDanger: {
    backgroundColor: "#fff5f5",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  cancelButton: {
    marginTop: 4,
    padding: 12,
  },
  cancelText: {
    color: "#6b7280",
    fontSize: 16,
  },
});