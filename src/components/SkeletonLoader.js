import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';

const SkeletonBlock = ({ style, animatedStyle }) => (
  <Animated.View style={[styles.block, animatedStyle, style]} />
);

export default function SkeletonLoader({ variant = 'list', count = 5, style }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 850,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 850,
          useNativeDriver: false,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const animatedStyle = {
    backgroundColor: shimmer.interpolate({
      inputRange: [0, 1],
      outputRange: ['#EEF2F7', '#F8FAFC'],
    }),
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <SkeletonBlock animatedStyle={animatedStyle} style={styles.headerTitle} />
      <SkeletonBlock animatedStyle={animatedStyle} style={styles.headerAction} />
    </View>
  );

  const renderListCard = (index) => (
    <View key={index} style={styles.listCard}>
      <SkeletonBlock animatedStyle={animatedStyle} style={styles.avatar} />
      <View style={styles.listContent}>
        <SkeletonBlock animatedStyle={animatedStyle} style={styles.lineLarge} />
        <SkeletonBlock animatedStyle={animatedStyle} style={styles.lineMedium} />
        <SkeletonBlock animatedStyle={animatedStyle} style={styles.lineSmall} />
      </View>
      <SkeletonBlock animatedStyle={animatedStyle} style={styles.sidePill} />
    </View>
  );

  const renderDetailSection = (index) => (
    <View key={index} style={styles.detailCard}>
      <SkeletonBlock animatedStyle={animatedStyle} style={styles.detailTitle} />
      <SkeletonBlock animatedStyle={animatedStyle} style={styles.detailLine} />
      <SkeletonBlock animatedStyle={animatedStyle} style={styles.detailLineShort} />
      <View style={styles.gridRow}>
        <SkeletonBlock animatedStyle={animatedStyle} style={styles.gridBlock} />
        <SkeletonBlock animatedStyle={animatedStyle} style={styles.gridBlock} />
      </View>
    </View>
  );

  const renderFormSection = (index) => (
    <View key={index} style={styles.formCard}>
      <View style={styles.formHeader}>
        <SkeletonBlock animatedStyle={animatedStyle} style={styles.formDot} />
        <SkeletonBlock animatedStyle={animatedStyle} style={styles.formTitle} />
      </View>
      <SkeletonBlock animatedStyle={animatedStyle} style={styles.inputLabel} />
      <SkeletonBlock animatedStyle={animatedStyle} style={styles.inputBlock} />
      <SkeletonBlock animatedStyle={animatedStyle} style={styles.inputLabel} />
      <SkeletonBlock animatedStyle={animatedStyle} style={styles.inputBlock} />
    </View>
  );

  const renderDashboard = () => (
    <>
      <SkeletonBlock animatedStyle={animatedStyle} style={styles.pageTitle} />
      <View style={styles.statsGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.statCard}>
            <View style={styles.statTop}>
              <SkeletonBlock animatedStyle={animatedStyle} style={styles.statIcon} />
              <SkeletonBlock animatedStyle={animatedStyle} style={styles.statValue} />
            </View>
            <SkeletonBlock animatedStyle={animatedStyle} style={styles.statLabel} />
          </View>
        ))}
      </View>
      <View style={styles.actionRow}>
        <SkeletonBlock animatedStyle={animatedStyle} style={styles.actionBlock} />
        <SkeletonBlock animatedStyle={animatedStyle} style={styles.actionBlock} />
      </View>
      {Array.from({ length: 3 }).map((_, index) => renderListCard(index))}
    </>
  );

  const renderContent = () => {
    if (variant === 'dashboard') return renderDashboard();
    if (variant === 'details') {
      return (
        <>
          {renderHeader()}
          {Array.from({ length: count }).map((_, index) => renderDetailSection(index))}
        </>
      );
    }
    if (variant === 'form') {
      return (
        <>
          {renderHeader()}
          {Array.from({ length: count }).map((_, index) => renderFormSection(index))}
        </>
      );
    }
    if (variant === 'boot') {
      return (
        <View style={styles.boot}>
          <SkeletonBlock animatedStyle={animatedStyle} style={styles.bootLogo} />
          <SkeletonBlock animatedStyle={animatedStyle} style={styles.bootLine} />
          <SkeletonBlock animatedStyle={animatedStyle} style={styles.bootLineShort} />
        </View>
      );
    }

    return Array.from({ length: count }).map((_, index) => renderListCard(index));
  };

  if (variant === 'boot') {
    return <View style={[styles.container, style]}>{renderContent()}</View>;
  }

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {renderContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  block: { backgroundColor: '#EEF2F7', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  headerTitle: { width: 150, height: 22, borderRadius: 6 },
  headerAction: { width: 38, height: 38, borderRadius: 10 },
  pageTitle: { width: 120, height: 24, borderRadius: 6, marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  statIcon: { width: 36, height: 36, borderRadius: 10 },
  statValue: { width: 48, height: 26, borderRadius: 6 },
  statLabel: { width: '72%', height: 14, borderRadius: 5 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 16 },
  actionBlock: { flex: 1, height: 54, borderRadius: 12 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 14, marginRight: 12 },
  listContent: { flex: 1 },
  lineLarge: { width: '72%', height: 16, borderRadius: 5, marginBottom: 8 },
  lineMedium: { width: '58%', height: 12, borderRadius: 5, marginBottom: 7 },
  lineSmall: { width: '42%', height: 10, borderRadius: 5 },
  sidePill: { width: 36, height: 12, borderRadius: 6 },
  detailCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  detailTitle: { width: '45%', height: 16, borderRadius: 5, marginBottom: 16 },
  detailLine: { width: '90%', height: 14, borderRadius: 5, marginBottom: 10 },
  detailLineShort: { width: '65%', height: 14, borderRadius: 5, marginBottom: 16 },
  gridRow: { flexDirection: 'row', gap: 10 },
  gridBlock: { flex: 1, height: 52, borderRadius: 8 },
  formCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  formHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  formDot: { width: 24, height: 24, borderRadius: 12, marginRight: 10 },
  formTitle: { width: 135, height: 16, borderRadius: 5 },
  inputLabel: { width: 88, height: 12, borderRadius: 4, marginTop: 16, marginLeft: 16, marginBottom: 8 },
  inputBlock: { height: 46, borderRadius: 8, marginHorizontal: 16 },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  bootLogo: { width: 82, height: 82, borderRadius: 22, marginBottom: 18 },
  bootLine: { width: '70%', height: 16, borderRadius: 6, marginBottom: 10 },
  bootLineShort: { width: '42%', height: 12, borderRadius: 6 },
});
