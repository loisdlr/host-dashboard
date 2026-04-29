import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { DateInput } from "@/components/DateInput";
import { Field } from "@/components/Field";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Picker } from "@/components/Picker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { useRental } from "@/contexts/RentalContext";
import { todayISO } from "@/utils/date";

const CATEGORIES = [
  "Cleaning",
  "Subscription",
  "Electricity",
  "Water",
  "Internet",
  "Complimentary Supplies",
  "Cleaning Supplies",
  "Maintenance & Repairs",
  "IFAE",
  "Rent",
  "Others",
];

export default function NewExpense() {
  const c = useColors();
  const router = useRouter();
  const { units, addExpense } = useRental();

  const [unitId, setUnitId] = useState<string>(units[0]?.id ?? "all");
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Complimentary Supplies");
  const [description, setDescription] = useState("");

  const submit = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      Alert.alert("Enter an amount");
      return;
    }
    addExpense({
      unitId,
      date,
      amount: value,
      category,
      description: description.trim(),
    });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader
        title="New expense"
        leftIcon="x"
        onLeftPress={() => router.back()}
      />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <Picker
          label="Unit"
          value={unitId}
          options={[
            { value: "all", label: "All units" },
            ...units.map((u) => ({ value: u.id, label: u.name })),
          ]}
          onChange={setUnitId}
        />
        <Picker
          label="Category"
          value={category}
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          onChange={setCategory}
        />
        <DateInput label="Date" value={date} onChange={setDate} />
        <Field
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
        />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What was this for?"
        />
        <View style={{ marginTop: 8 }}>
          <Button label="Save expense" onPress={submit} fullWidth />
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({});
