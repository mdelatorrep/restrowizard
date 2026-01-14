import { BusinessOpeningAssistant } from '@/components/BusinessOpeningAssistant';
import { RequireActiveClient } from '@/components/consultant/RequireActiveClient';

export default function ConsultantNewBusiness() {
  return (
    <RequireActiveClient>
      <BusinessOpeningAssistant userType="consultant" />
    </RequireActiveClient>
  );
}
