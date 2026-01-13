// Auth context and hooks
export { AuthProvider, useAuth } from "./context";

// Permission utilities (pure UI helpers, no role checks)
export {
  can,
  canAny,
  canAll,
  PermissionGroups,
} from "./permissions";
