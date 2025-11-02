/**
 * AlternativeList Component
 * Displays healthier food alternatives
 */

import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { AlternativeSuggestion } from '@/lib/food-label-scanner/models/AlternativeSuggestion';
import { Card } from '@/components/common/Card';
import { Typography } from '@/components/common/Typography';

export interface AlternativeListProps {
  alternatives: AlternativeSuggestion[];
  onSelect?: (alternative: AlternativeSuggestion) => void;
  language?: 'en' | 'tr';
}

export const AlternativeList: React.FC<AlternativeListProps> = ({
  alternatives,
  onSelect,
  language = 'en',
}) => {
  const labels = {
    en: {
      title: 'Healthier Alternatives',
      improvement: 'improvement',
      reason: 'Reason',
    },
    tr: {
      title: 'Daha Sağlıklı Alternatifler',
      improvement: 'iyileştirme',
      reason: 'Sebep',
    },
  };

  const t = labels[language];

  const renderAlternative = ({ item, index }: { item: AlternativeSuggestion; index: number }) => (
    <TouchableOpacity
      onPress={() => onSelect && onSelect(item)}
      testID={`alternative-${index}`}
      style={styles.alternativeItem}
    >
      <Card>
        <Typography variant="subheading">{item.name}</Typography>
        <Typography variant="body" color="success">
          {Math.round(item.getOverallImprovementPercentage())}% {t.improvement}
        </Typography>
        <Typography variant="caption" color="neutral" style={styles.reason}>
          {t.reason}: {item.reason || item.getPrimaryImprovementCategory()}
        </Typography>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Typography variant="heading" style={styles.title}>
        {t.title}
      </Typography>
      <FlatList
        data={alternatives}
        renderItem={renderAlternative}
        keyExtractor={(item, index) => item.name || index.toString()}
        ListEmptyComponent={
          <Card>
            <Typography variant="body" color="neutral">
              {language === 'en'
                ? 'No alternatives available'
                : 'Alternatif bulunamadı'}
            </Typography>
          </Card>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  alternativeItem: {
    marginVertical: 8,
  },
  reason: {
    marginTop: 4,
  },
});

