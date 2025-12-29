import { SubscriptionManager } from '../components';
import { LazorProvider } from '../context';

export function SubscriptionPage() {
  return (
    <LazorProvider>
      <SubscriptionManager />
    </LazorProvider>
  );
}
