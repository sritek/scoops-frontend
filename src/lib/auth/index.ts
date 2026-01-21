// Auth context and hooks (staff)
export { AuthProvider, useAuth } from "./context";

// Parent auth context and hooks
export {
  ParentAuthProvider,
  useParentAuth,
  type Parent,
  type ParentAuthState,
  type OTPRequestResult,
  type OTPVerifyResult,
} from "./parent-context";

// Permission utilities (pure UI helpers, no role checks)
export {
  can,
  canAny,
  canAll,
  PermissionGroups,
} from "./permissions";
