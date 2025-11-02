/**
 * AllergenCard Component
 * Displays allergen warnings and information
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AllergenInfo } from '@/lib/food-label-scanner/models/AllergenInfo';
import { Card } from '@/components/common/Card';
import { Typography } from '@/components/common/Typography';
import { ColorPalette } from '@/constants/colors';

export interface AllergenCardProps {
  allergens: AllergenInfo[];
  language?: 'en' | 'tr';
}

export const AllergenCard: React.FC<AllergenCardProps> = ({
  allergens,
  language = 'en',
}) => {
  const labels = {
    en: {
      title: 'Allergen Information',
      warning: 'Contains',
      none: 'No known allergens',
    },
    tr: {
      title: 'Alerjen Bilgileri',
      warning: 'İçerir',
      none: 'Bilinen alerjen yok',
    },
  };

  const t = labels[language];

  if (allergens.length === 0) {
    return (
      <Card>
        <Typography variant="heading" style={styles.title}>
          {t.title}
        </Typography>
        <Typography variant="body" color="success">
          {t.none}
        </Typography>
      </Card>
    );
  }

  return (
    <Card>
      <Typography variant="heading" style={styles.title}>
        {t.title}
      </Typography>
      {allergens.map((allergen, index) => {
        const severityColor =
          allergen.severity === 'high'
            ? ColorPalette.error.main
            : allergen.severity === 'medium'
            ? ColorPalette.warning.main
            : ColorPalette.info.main;

        return (
          <View
            key={index}
            style={[styles.allergenItem, { borderLeftColor: severityColor }]}
            testID={`allergen-${allergen.severity}-${allergen.name.toLowerCase()}`}
          >
            <Typography variant="subheading" style={{ color: severityColor }}>
              {allergen.name}
            </Typography>
            <Typography variant="caption" color="neutral">
              {t.warning}: {allergen.severity} severity
            </Typography>
            {allergen.description && (
              <Typography variant="caption" color="neutral" style={styles.description}>
                {allergen.description}
              </Typography>
            )}
          </View>
        );
      })}
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
  },
  allergenItem: {
    padding: 12,
    marginVertical: 4,
    borderLeftWidth: 4,
    backgroundColor: ColorPalette.neutral[50],
    borderRadius: 8,
  },
  description: {
    marginTop: 4,
  },
});

