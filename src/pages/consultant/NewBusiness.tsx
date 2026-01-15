import { BusinessOpeningAssistant } from '@/components/BusinessOpeningAssistant';
import { RequireActiveClient } from '@/components/consultant/RequireActiveClient';

export default function ConsultantNewBusiness() {
  return (
    <RequireActiveClient moduleName="Apertura de Nuevo Negocio">
      <BusinessOpeningAssistant userType="consultant" />
    </RequireActiveClient>
  );
}
