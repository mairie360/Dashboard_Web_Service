import { createNonce } from '@mairie360/lib-components/shared';
import DashboardPage from '../components/DashboardPage';
import { loadInitialDashboard } from '@/lib/server-dashboard';

export default async function Home() {
  const initialData = await loadInitialDashboard();
  return <DashboardPage key={createNonce()} initialData={initialData} />;
}
