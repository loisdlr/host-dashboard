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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Picker } from "@/components/Picker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import { parseISODate, todayISO, toISODate, ymKey } from "@/utils/date";
import { formatMoney } from "@/utils/finance";

export default function DuesScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bills, units, addBill, deleteBill, toggleBillPaid, settings } =
    useRental();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("5");
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");

  const today = parseISODate(todayISO());
  const ym = ymKey(todayISO());

  const dueList = useMemo(() => {
    const items = bills.map((bill) => {
      const dueDate = new Date(today.getFullYear(), today.getMonth(), bill.dueDay);
      let useDate = dueDate;
      let useYm = ymKey(toISODate(dueDate));
      if (bill.paidMonths.includes(useYm)) {
        // show next month if already paid
        useDate = new Date(today.getFullYear(), today.getMonth() + 1, bill.dueDay);
        useYm = ymKey(toISODate(useDate));
      }
      const days = Math.ceil(
        (useDate.getTime() - today.getTime()) / 86_400_000,
      );
      return { bill, dueDate: useDate, daysAway: days, ymKey: useYm };
    });
    return items.sort((a, b) => a.daysAway - b.daysAway);
  }, [bills, today]);

  const unitName = (id: string) => units.find((u) => u.id === id)?.name ?? "—";

  const submit = () => {
    if (!name.trim() || !unitId) {
      Alert.alert("Fill in name and unit");
      return;
    }
    const amt = Number(amount);
    const day = Number(dueDay);
    if (!amt || day < 1 || day > 31) {
      Alert.alert("Invalid amount or due day");
      return;
    }
    addBill({
      unitId,
      name: name.trim(),
      amount: amt,
      dueDay: day,
      recurring: true,
    });
    setName("");
    setAmount("");
    setDueDay("5");
    setShowAdd(false);
  };

  const totalDue = dueList
    .filter(({ bill, ymKey: y }) => !bill.paidMonths.includes(y))
    .reduce((s, { bill }) => s + bill.amount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="Bills & dues"
        leftIcon="chevron-left"
        onLeftPress={() => router.back()}
        rightIcon="plus"
        onRightPress={() => setShowAdd(true)}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 30,
          gap: 12,
        }}
      >
        <Card>
          <Text
            style={{
              color: c.mutedForeground,
              fontFamily: "Inter_500Medium",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Total due this period
          </Text>
          <Text
            style={{
              color: c.foreground,
              fontFamily: "Inter_700Bold",
              fontSize: 28,
              marginTop: 4,
            }}
          >
            {formatMoney(totalDue, settings.currency)}
          </Text>
        </Card>

        {dueList.length === 0 ? (
          <Card>
            <EmptyState
              icon="bell"
              title="No bills tracked"
              description="Add internet, association dues, electricity, etc."
              action={<Button label="Add bill" onPress={() => setShowAdd(true)} />}
            />
          </Card>
        ) : (
          dueList.map(({ bill, dueDate, daysAway, ymKey: y }) => {
            const isPaid = bill.paidMonths.includes(y);
            const overdue = !isPaid && daysAway < 0;
            return (
              <Card key={bill.id}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: overdue
                          ? c.destructive + "1A"
                          : isPaid
                            ? c.success + "1A"
                            : daysAway <= 3
                              ? c.warning + "1A"
                              : c.muted,
                        borderRadius: c.radius - 6,
                      },
                    ]}
                  >
                    {isPaid ? (
                      <Feather name="check" size={20} color={c.success} />
                    ) : (
                      <>
                        <Text
                          style={{
                            color: overdue
                              ? c.destructive
                              : daysAway <= 3
                                ? c.warning
                                : c.foreground,
                            fontFamily: "Inter_700Bold",
                            fontSize: 18,
                          }}
                        >
                          {Math.abs(daysAway)}
                        </Text>
                        <Text
                          style={{
                            color: overdue
                              ? c.destructive
                              : daysAway <= 3
                                ? c.warning
                                : c.mutedForeground,
                            fontFamily: "Inter_500Medium",
                            fontSize: 10,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {overdue ? "late" : "days"}
                        </Text>
                      </>
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={{
                        color: c.foreground,
                        fontFamily: "Inter_700Bold",
                        fontSize: 15,
                      }}
                    >
                      {bill.name}
                    </Text>
                    <Text
                      style={{
                        color: c.mutedForeground,
                        fontFamily: "Inter_400Regular",
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {unitName(bill.unitId)} · day {bill.dueDay} of every month
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        color: c.foreground,
                        fontFamily: "Inter_700Bold",
                        fontSize: 15,
                      }}
                    >
                      {formatMoney(bill.amount, settings.currency)}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    marginTop: 12,
                    alignItems: "center",
                  }}
                >
                  <Pressable
                    onPress={() => toggleBillPaid(bill.id, y)}
                    style={({ pressed }) => [
                      styles.payBtn,
                      {
                        backgroundColor: isPaid ? c.muted : c.primary,
                        borderRadius: c.radius - 4,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isPaid ? c.foreground : c.primaryForeground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 12,
                      }}
                    >
                      {isPaid ? "Mark unpaid" : "Mark paid"}
                    </Text>
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  <Pressable
                    hitSlop={10}
                    onPress={() =>
                      Alert.alert("Delete bill", `Remove ${bill.name}?`, [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => deleteBill(bill.id),
                        },
                      ])
                    }
                  >
                    <Feather name="trash-2" size={16} color={c.mutedForeground} />
                  </Pressable>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdd(false)}
      >
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <ScreenHeader
            title="Add bill"
            leftIcon="x"
            onLeftPress={() => setShowAdd(false)}
          />
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={20}
          >
            <Picker
              label="Unit"
              value={unitId}
              options={units.map((u) => ({ value: u.id, label: u.name }))}
              onChange={setUnitId}
            />
            <Field
              label="Bill name"
              value={name}
              onChangeText={setName}
              placeholder="Internet, association dues..."
            />
            <Field
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <Field
              label="Due day of month"
              value={dueDay}
              onChangeText={setDueDay}
              keyboardType="numeric"
              hint="1-31. Recurring monthly."
            />
            <Button label="Save bill" onPress={submit} fullWidth />
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  dayChip: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  payBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
});
