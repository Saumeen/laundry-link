import { CustomerDashboard } from '@/customer/components/CustomerDashboard';
import { CustomerLayout } from '@/customer/components/CustomerLayout';

export default function CustomerDashboardPage() {
  return (
    <CustomerLayout>
      <CustomerDashboard />
    </CustomerLayout>
  );
}
