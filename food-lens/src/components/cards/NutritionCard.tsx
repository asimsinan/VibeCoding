/**
 * NutritionCard Component
 * Displays nutrition information in a beautiful card
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { NutritionInfo } from '@/lib/food-label-scanner/models/NutritionInfo';
import { Card } from '@/components/common/Card';
import { Typography } from '@/components/common/Typography';

export interface NutritionCardProps {
  nutrition: NutritionInfo;
  language?: 'en' | 'tr';
}

export const NutritionCard: React.FC<NutritionCardProps> = ({
  nutrition,
  language = 'en',
}) => {
  const [expanded, setExpanded] = useState(false);

  const labels = {
    en: {
      calories: 'Calories',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      fiber: 'Fiber',
      sodium: 'Sodium',
      sugar: 'Sugar',
      saturatedFat: 'Saturated Fat',
      transFat: 'Trans Fat',
      servingSize: 'Serving Size',
      vitamins: 'Vitamins',
      minerals: 'Minerals',
      expand: 'Show Details',
      collapse: 'Hide Details',
      noVitamins: 'No vitamins listed',
      noMinerals: 'No minerals listed',
    },
    tr: {
      calories: 'Kalori',
      protein: 'Protein',
      carbs: 'Karbonhidrat',
      fat: 'Yağ',
      fiber: 'Lif',
      sodium: 'Sodyum',
      sugar: 'Şeker',
      saturatedFat: 'Doymuş Yağ',
      transFat: 'Trans Yağ',
      servingSize: 'Porsiyon',
      vitamins: 'Vitaminler',
      minerals: 'Mineraller',
      expand: 'Detayları Göster',
      collapse: 'Detayları Gizle',
      noVitamins: 'Vitamin bilgisi yok',
      noMinerals: 'Mineral bilgisi yok',
    },
  };

  const t = labels[language];

  return (
    <Card>
      <Typography variant="heading" style={styles.title}>
        {language === 'en' ? 'Nutrition Facts' : 'Beslenme Bilgileri'}
      </Typography>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Typography variant="heading" color="primary">
            {nutrition.calories}
          </Typography>
          <Typography variant="caption" color="neutral">
            {t.calories}
          </Typography>
        </View>
        <View style={styles.summaryItem}>
          <Typography variant="subheading">{nutrition.nutrients.protein}g</Typography>
          <Typography variant="caption" color="neutral">
            {t.protein}
          </Typography>
        </View>
        <View style={styles.summaryItem}>
          <Typography variant="subheading">{nutrition.nutrients.carbs}g</Typography>
          <Typography variant="caption" color="neutral">
            {t.carbs}
          </Typography>
        </View>
        <View style={styles.summaryItem}>
          <Typography variant="subheading">{nutrition.nutrients.fat}g</Typography>
          <Typography variant="caption" color="neutral">
            {t.fat}
          </Typography>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        testID="expand-nutrition"
        style={styles.expandButton}
      >
        <Typography variant="body" color="primary">
          {expanded ? t.collapse : t.expand}
        </Typography>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.details} testID="nutrition-details">
          {/* Serving Size */}
          <View style={styles.section}>
            <Typography variant="subheading" style={styles.sectionTitle}>
              {t.servingSize}: {nutrition.servingSize}
            </Typography>
          </View>

          {/* Additional Macronutrients */}
          <View style={styles.section}>
            <Typography variant="subheading" style={styles.sectionTitle}>
              Additional Nutrients
            </Typography>
            <View style={styles.detailRow}>
              <Typography variant="body">{t.fiber}</Typography>
              <Typography variant="body">{nutrition.nutrients.fiber}g</Typography>
            </View>
            <View style={styles.detailRow}>
              <Typography variant="body">{t.sodium}</Typography>
              <Typography variant="body">{nutrition.nutrients.sodium}mg</Typography>
            </View>
            <View style={styles.detailRow}>
              <Typography variant="body">{t.sugar}</Typography>
              <Typography variant="body">{nutrition.nutrients.sugar}g</Typography>
            </View>
            <View style={styles.detailRow}>
              <Typography variant="body">{t.saturatedFat}</Typography>
              <Typography variant="body">{nutrition.nutrients.saturatedFat}g</Typography>
            </View>
            <View style={styles.detailRow}>
              <Typography variant="body">{t.transFat}</Typography>
              <Typography variant="body">{nutrition.nutrients.transFat}g</Typography>
            </View>
          </View>

          {/* Vitamins */}
          {nutrition.vitamins && nutrition.vitamins.length > 0 && (
            <View style={styles.section}>
              <Typography variant="subheading" style={styles.sectionTitle}>
                {t.vitamins}
              </Typography>
              {nutrition.vitamins.map((vitamin, index) => (
                <View key={index} style={styles.detailRow}>
                  <Typography variant="body">
                    {vitamin.name}
                    {vitamin.dailyValue > 0 && ` (${vitamin.dailyValue}% DV)`}
                  </Typography>
                  <Typography variant="body">
                    {vitamin.amount} {vitamin.unit}
                  </Typography>
                </View>
              ))}
            </View>
          )}

          {/* Minerals */}
          {nutrition.minerals && nutrition.minerals.length > 0 && (
            <View style={styles.section}>
              <Typography variant="subheading" style={styles.sectionTitle}>
                {t.minerals}
              </Typography>
              {nutrition.minerals.map((mineral, index) => (
                <View key={index} style={styles.detailRow}>
                  <Typography variant="body">
                    {mineral.name}
                    {mineral.dailyValue > 0 && ` (${mineral.dailyValue}% DV)`}
                  </Typography>
                  <Typography variant="body">
                    {mineral.amount} {mineral.unit}
                  </Typography>
                </View>
              ))}
            </View>
          )}

          {/* Brand if available */}
          {nutrition.brand && (
            <View style={styles.section}>
              <Typography variant="caption" color="neutral">
                Brand: {nutrition.brand}
              </Typography>
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  expandButton: {
    marginTop: 8,
  },
  details: {
    marginTop: 16,
    gap: 16,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
});

