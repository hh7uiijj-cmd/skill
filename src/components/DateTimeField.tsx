import React, { useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from './ui';

export function DateTimeField({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <Text style={styles.dateText} onPress={() => setShowPicker(true)}>
        {value.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
      </Text>
      {showPicker && (
        <DateTimePicker
          value={value}
          mode="datetime"
          onChange={(_, selected) => {
            setShowPicker(Platform.OS === 'ios');
            if (selected) onChange(selected);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dateText: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#fff',
  },
});
