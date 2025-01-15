import React from "react";
import { View, ScrollView, Text } from "react-native";

const HistoryView = ({ history }) => {
  return (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Health History</Text>
      <ScrollView horizontal={true}>
        {history.map((item, index) => (
          <View key={index} style={styles.historyItem}>
            <Text style={styles.historyText}>{item.timestamp}</Text>
            <Text style={styles.historyText}>
              Blood Sugar: {item.bloodSugar} mg/dL
            </Text>
            <Text style={styles.historyText}>
              Oxygen Level: {item.oxygenLevel}%
            </Text>
            <Text style={styles.historyText}>
              Pulse Rate: {item.pulseRate} bpm
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// Styles
const styles = {
  historyContainer: {
    width: "100%",
    marginTop: 20,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  historyItem: {
    backgroundColor: "#fff",
    padding: 10,
    marginRight: 10,
    borderRadius: 10,
    elevation: 2, // For Android shadow effect
    shadowColor: "#000", // For iOS shadow effect
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyText: {
    fontSize: 16,
    color: "#333",
  },
};

export default HistoryView;
