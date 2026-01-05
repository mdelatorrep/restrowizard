import { RequireActiveClient } from '@/components/consultant/RequireActiveClient';
import GhostKitchenModule from '@/components/GhostKitchenModule';

const ConsultantGhostKitchen = () => {
  return (
    <RequireActiveClient moduleName="Ghost Kitchen">
      <GhostKitchenModule />
    </RequireActiveClient>
  );
};

export default ConsultantGhostKitchen;
