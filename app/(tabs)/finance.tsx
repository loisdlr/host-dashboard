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
import { formatLong, parseISODate, todayISO, toISODate, formatShort } from "@/utils/date";
import { formatMoney, splitForAll, splitForUnit } from "@/utils/finance";
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

  const periodLabel = period === "month" ? "This month" : period === "ytd" ? "Year to date" : "All time";

  // ==================== PDF EXPORT LOGIC ====================
  
  const onExportPdf = async () => {
    try {
      const targetUnits = unitId === "all" ? units : units.filter((u) => u.id === unitId);
      
      if (targetUnits.length === 0) {
        Alert.alert("No unit selected");
        return;
      }

      const html = unitId === "all" 
        ? buildPortfolioPdf(units, bookings, expenses, settings, range, periodLabel)
        : buildSingleUnitPdf(targetUnits[0]!, bookings, expenses, settings, range, periodLabel);

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
      
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Could not export PDF.");
    }
  };

  // ==================== NAVIGATION & ACTIONS ====================

  const handleEditNavigate = () => {
    const id = selectedExpense?.id;
    setSelectedExpense(null); // Close modal first to prevent crash
    if (id) {
      router.push(`/expense/${id}`);
    }
  };

  const handleDelete = () => {
    const id = selectedExpense?.id;
    if (!id) return;

    Alert.alert("Confirm Delete", "Are you sure you want to remove this expense?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => {
          deleteExpense(id);
          setSelectedExpense(null);
        } 
      }
    ]);
  };

  if (!settings) return null;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title="Finance" subtitle={periodLabel} rightIcon="settings" onRightPress={() => router.push("/settings")} />

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

        <Button label="Generate Financial PDF" variant="secondary" icon={<Feather name="file-text" size={18} color={c.foreground} />} onPress={onExportPdf} fullWidth />

        <Card>
          <Text style={{ fontSize: 13, color: c.mutedForeground }}>Net Profit</Text>
          <Text style={{ fontSize: 32, fontWeight: "800", color: result.net >= 0 ? c.foreground : c.destructive }}>
            {formatMoney(result.net, settings.currency)}
          </Text>
          <SplitBar investor={result.investorShare} operator={result.operatorShare} investorPct={settings.investorSharePct} operatorPct={settings.operatorSharePct} currency={settings.currency} />
        </Card>

        {/* Expense List */}
        <View>
          <Text style={styles.sectionTitle}>Recent expenses</Text>
          <Card style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
            {expenses.filter(e => unitId === 'all' || e.unitId === unitId).slice(0, 10).map((e, idx) => (
              <Pressable key={e.id} onPress={() => setSelectedExpense(e)} style={[styles.expenseRow, idx !== 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expenseDesc}>{e.description || e.category}</Text>
                  <Text style={styles.expenseMeta}>{formatShort(e.date)} · {e.category}</Text>
                </View>
                <Text style={styles.expenseAmount}>-{formatMoney(e.amount, settings.currency)}</Text>
                <Feather name="more-vertical" size={16} color={c.mutedForeground} style={{ marginLeft: 8 }} />
              </Pressable>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* Action Modal */}
      <Modal visible={!!selectedExpense} transparent animationType="fade" onRequestClose={() => setSelectedExpense(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedExpense(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Expense Options</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleEditNavigate}>
              <Feather name="edit-2" size={18} color={c.primary} />
              <Text style={styles.modalButtonText}>Edit Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#fff5f5' }]} onPress={handleDelete}>
              <Feather name="trash-2" size={18} color="#ef4444" />
              <Text style={[styles.modalButtonText, { color: '#ef4444' }]}>Delete Expense</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ==================== PDF BUILDERS ====================

function buildPortfolioPdf(units: any[], bookings: any[], expenses: any[], settings: any, range: any, label: string) {
  const result = splitForAll(bookings, expenses, settings, range);
  return `
    <html>
      <body style="font-family: sans-serif; padding: 40px;">
        <h1 style="text-align:center;">CozyManhattan Portfolio Statement</h1>
        <p style="text-align:center;">${label}</p>
        <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h2>Net Profit: ${formatMoney(result.net, settings.currency)}</h2>
          <p>Investor Share: ${formatMoney(result.investorShare, settings.currency)}</p>
          <p>Operator Share: ${formatMoney(result.operatorShare, settings.currency)}</p>
        </div>
        <h3>Combined Activity</h3>
        <table style="width:100%; border-collapse: collapse;">
          <tr style="background:#eee;">
            <th style="border:1px solid #ddd; padding:8px;">Date</th>
            <th style="border:1px solid #ddd; padding:8px;">Unit</th>
            <th style="border:1px solid #ddd; padding:8px;">Description</th>
            <th style="border:1px solid #ddd; padding:8px;">Amount</th>
          </tr>
          ${expenses.filter(e => !range || (e.date >= range.start && e.date <= range.end)).map(e => `
            <tr>
              <td style="border:1px solid #ddd; padding:8px;">${formatShort(e.date)}</td>
              <td style="border:1px solid #ddd; padding:8px;">${units.find(u => u.id === e.unitId)?.name || 'Portfolio'}</td>
              <td style="border:1px solid #ddd; padding:8px;">${e.description || e.category}</td>
              <td style="border:1px solid #ddd; padding:8px; color:red;">-${formatMoney(e.amount, settings.currency)}</td>
            </tr>
          `).join('')}
        </table>
      </body>
    </html>
  `;
}

function buildSingleUnitPdf(unit: any, bookings: any[], expenses: any[], settings: any, range: any, label: string) {
  const result = splitForUnit(unit.id, bookings, expenses, settings, range);
  return `
    <html>
      <body style="font-family: sans-serif; padding: 40px;">
        <h1 style="text-align:center;">${unit.name} Statement</h1>
        <p style="text-align:center;">${label}</p>
        <div style="background: #eef2ff; padding: 20px; border-radius: 10px;">
          <h2>Net Profit: ${formatMoney(result.net, settings.currency)}</h2>
          <p>Investor: ${formatMoney(result.investorShare, settings.currency)}</p>
          <p>Operator: ${formatMoney(result.operatorShare, settings.currency)}</p>
        </div>
      </body>
    </html>
  `;
}

// ==================== STYLES & UI ====================

function UnitChip({ label, active, onPress }: any) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: active ? c.primary : c.muted }]}>
      <Text style={{ color: active ? "white" : c.foreground, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

function SplitBar({ investor, operator, investorPct, operatorPct, currency }: any) {
  const c = useColors();
  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: '#eee' }}>
        <View style={{ width: `${investorPct}%`, backgroundColor: c.primary }} />
        <View style={{ width: `${operatorPct}%`, backgroundColor: '#94a3b8' }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 12, color: c.mutedForeground }}>Inv: ${investor.toFixed(0)}</Text>
        <Text style={{ fontSize: 12, color: c.mutedForeground }}>Op: ${operator.toFixed(0)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  expenseRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  expenseDesc: { fontWeight: "600", fontSize: 14 },
  expenseMeta: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  expenseAmount: { color: "#ef4444", fontWeight: "700" },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "white", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 20, textAlign: 'center' },
  modalButton: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 12, marginBottom: 12, backgroundColor: "#f8f9fa" },
  modalButtonText: { fontSize: 16, fontWeight: "600" },
});