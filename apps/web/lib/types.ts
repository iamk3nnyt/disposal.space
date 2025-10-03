// Shared types that can be used in both client and server components

export enum Membership {
  FREE = "free",
  PREMIUM = "premium",
}

// Re-export for consistency with database package
export { Membership as MembershipType };
