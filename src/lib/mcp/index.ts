import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import listMenuItems from "./tools/list-menu-items";
import listInventoryItems from "./tools/list-inventory-items";
import listRecentOrders from "./tools/list-recent-orders";
import listReservations from "./tools/list-reservations";
import getLatestDiagnosis from "./tools/get-latest-diagnosis";

// The OAuth issuer MUST be the direct Supabase host, not the .lovable.cloud proxy.
// Build it from VITE_SUPABASE_PROJECT_ID which Vite inlines as a literal at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "restrowizard-mcp",
  title: "RestroWizard",
  version: "0.1.0",
  instructions:
    "Tools for a RestroWizard restaurant owner's own data: profile and restaurants, menu items, inventory, recent orders, reservations, and the latest maturity diagnosis. All tools act as the signed-in user; RLS scopes results to that user's restaurant.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyProfile,
    listMenuItems,
    listInventoryItems,
    listRecentOrders,
    listReservations,
    getLatestDiagnosis,
  ],
});
