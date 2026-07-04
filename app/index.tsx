import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../src/constants/colors';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cream, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.orange} />
    </View>
  );
}
