import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, View, Platform } from "react-native";

import { Button } from "@/components/Button";
import { DateInput } from "@/components/DateInput";
import { Field } from "@/components/Field";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Picker } from "@/components/Picker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import { todayISO } from "@/utils/date";

export default function NewExpenseScreen() {
  const c = useColors();
  const router = useRouter();
  const { units, addExpense } = useRental();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [category, setCategory] = useState("Maintenance");

  const submit = () => {
    const value = Number(amount);
    if (!description.trim() || !value) {
      Alert.alert("Error", "Please enter a description and valid amount");
      return;
    }

    addExpense({
      description: description.trim(),
      amount: value,
      date,
      unitId,
      category,
    });

    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="New Expense"
        leftIcon="chevron-left"
        onLeftPress={() => router.back()}
      />

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Field
          label="Description"
          placeholder="e.g. Electricity, Repairs"
          value={description}
          onChangeText={setDescription}
        />

        <Field
          label="Amount"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <DateInput label="Date" value={date} onChange={setDate} />

        <Picker
          label="Unit"
          value={unitId}
          options={units.map((u) => ({ label: u.name, value: u.id }))}
          onChange={setUnitId}
        />

        <Picker
          label="Category"
          value={category}
          options={[
            { label: "Maintenance", value: "Maintenance" },
            { label: "Utilities", value: "Utilities" },
            { label: "Supplies", value: "Supplies" },
            { label: "Marketing", value: "Marketing" },
            { label: "Other", value: "Other" },
          ]}
          onChange={setCategory}
        />

        <View style={{ marginTop: 10 }}>
          <Button label="Save Expense" onPress={submit} fullWidth />
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({});