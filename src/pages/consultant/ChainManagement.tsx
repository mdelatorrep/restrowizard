import { RequireActiveClient } from '@/components/consultant/RequireActiveClient';
import ChainManagementModule from '@/components/ChainManagementModule';

const ConsultantChainManagement = () => {
  return (
    <RequireActiveClient moduleName="Gestión de Cadenas">
      <ChainManagementModule />
    </RequireActiveClient>
  );
};

export default ConsultantChainManagement;
