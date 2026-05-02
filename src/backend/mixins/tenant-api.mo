import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import SubTypes "../types/subscription";
import TenantLib "../lib/tenant";
import InvoiceTypes "../types/invoice";
import BrandingTypes "../types/branding";

mixin (
  accessControlState : AccessControl.AccessControlState,
  tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>,
  invoices : Map.Map<CommonTypes.InvoiceId, InvoiceTypes.Invoice>,
  practiceSettings : Map.Map<CommonTypes.UserId, BrandingTypes.PracticeSettings>,
  activationSlots : Map.Map<Text, SubTypes.ActivationSlot>,
  migrationDone : { var value : Bool },
) {
  /// Hardcoded admin phone number.
  let ADMIN_PHONE : Text = "9403612490";

  /// One-time migration: clear all tenants on first startup after deploy.
  if (not migrationDone.value) {
    TenantLib.clearAll(tenants);
    activationSlots.clear();
    migrationDone.value := true;
  };

  /// Helper: assert caller's phone matches ADMIN_PHONE.
  func assertAdminPhone(caller : CommonTypes.UserId) {
    switch (tenants.get(caller)) {
      case (?t) {
        if (t.phone != ADMIN_PHONE) Runtime.trap("Unauthorized: admin only");
      };
      case null Runtime.trap("Unauthorized: admin only");
    };
  };

  /// Activate account using phone + 4-digit code + shop name.
  public shared ({ caller }) func activateWithCode(phone : Text, code : Text, shopName : Text) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    AccessControl.initialize(accessControlState, caller);
    TenantLib.activateWithCode(tenants, activationSlots, caller, phone, code, shopName);
  };

  /// Legacy: register tenant for caller — kept for compatibility but redirects to activateWithCode flow.
  /// Callers should use activateWithCode instead.
  public shared ({ caller }) func registerTenant(shopName : Text, phone : Text) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Must be logged in to register");
    };
    AccessControl.initialize(accessControlState, caller);
    let view = TenantLib.register(tenants, caller, shopName, phone);
    #ok(view);
  };

  /// Get subscription status for the caller.
  public query ({ caller }) func getCallerTenantStatus() : async ?SubTypes.TenantStatus {
    TenantLib.getStatus(tenants, caller);
  };

  /// Query: returns true if the caller's registered phone matches ADMIN_PHONE.
  public query ({ caller }) func isCallerAdminPhone() : async Bool {
    switch (tenants.get(caller)) {
      case null false;
      case (?t) TenantLib.isAdminPhone(t.phone, ADMIN_PHONE);
    };
  };

  /// Admin only: list all tenants with optional name/phone search.
  public query ({ caller }) func adminListTenants(search : ?Text) : async [SubTypes.AdminTenantView] {
    assertAdminPhone(caller);
    TenantLib.listAll(tenants, search);
  };

  /// Admin only: get a single tenant by ID.
  public query ({ caller }) func adminGetTenant(tenantId : CommonTypes.UserId) : async ?SubTypes.AdminTenantView {
    assertAdminPhone(caller);
    TenantLib.getById(tenants, tenantId);
  };

  /// Admin only: set subscription status for a tenant.
  public shared ({ caller }) func adminSetTenantStatus(tenantId : CommonTypes.UserId, status : SubTypes.TenantStatus) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    assertAdminPhone(caller);
    switch (TenantLib.setStatus(tenants, tenantId, status)) {
      case null #err("Tenant not found");
      case (?view) #ok(view);
    };
  };

  /// Admin only: approve a pending tenant (sets status to active).
  public shared ({ caller }) func approveTenant(tenantId : CommonTypes.UserId) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    assertAdminPhone(caller);
    switch (TenantLib.approveTenant(tenants, tenantId)) {
      case null #err("Tenant not found");
      case (?view) #ok(view);
    };
  };

  /// Admin only: reject a tenant (sets status to rejected; they remain in the system).
  public shared ({ caller }) func rejectTenant(tenantId : CommonTypes.UserId) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    assertAdminPhone(caller);
    switch (TenantLib.rejectTenant(tenants, tenantId)) {
      case null #err("Tenant not found");
      case (?view) #ok(view);
    };
  };

  /// Admin only: extend subscription expiry date.
  public shared ({ caller }) func adminExtendTenantExpiry(tenantId : CommonTypes.UserId, newExpiresAt : CommonTypes.Timestamp) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    assertAdminPhone(caller);
    switch (TenantLib.extendExpiry(tenants, tenantId, newExpiresAt)) {
      case null #err("Tenant not found");
      case (?view) #ok(view);
    };
  };

  /// Admin only: delete a tenant and all their invoices and settings.
  public shared ({ caller }) func adminDeleteTenant(tenantId : CommonTypes.UserId) : async { #ok; #err : Text } {
    assertAdminPhone(caller);
    switch (tenants.get(tenantId)) {
      case null return #err("Tenant not found");
      case (?_) {
        tenants.remove(tenantId);
        // Delete tenant's invoices
        let toDelete = invoices.entries()
          .filter(func((_, inv)) { Principal.equal(inv.owner, tenantId) })
          .map(func((id, _)) { id })
          .toArray();
        for (id in toDelete.values()) {
          invoices.remove(id);
        };
        // Delete tenant's practice settings
        practiceSettings.remove(tenantId);
        #ok;
      };
    };
  };

  /// Admin only: mark subscription as cash paid and activate tenant.
  public shared ({ caller }) func adminMarkCashPaid(tenantId : CommonTypes.UserId, note : Text) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    assertAdminPhone(caller);
    switch (TenantLib.markCashPaid(tenants, tenantId, note)) {
      case null #err("Tenant not found");
      case (?view) #ok(view);
    };
  };

  /// Admin only: verify a 4-digit approval code and approve the tenant if it matches.
  public shared ({ caller }) func verifyAndApproveTenant(tenantId : CommonTypes.UserId, code : Text) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    switch (tenants.get(caller)) {
      case null return #err("Unauthorized: admin only");
      case (?callerTenant) {
        if (callerTenant.phone != ADMIN_PHONE) {
          return #err("Unauthorized: admin only");
        };
      };
    };
    switch (tenants.get(tenantId)) {
      case null #err("Tenant not found");
      case (?t) {
        if (t.approvalCode == code) {
          t.subscriptionStatus := #active;
          #ok(TenantLib.toView(t));
        } else {
          #err("Invalid approval code");
        };
      };
    };
  };

  /// Admin only: aggregate stats across all tenants.
  public query ({ caller }) func adminGetAllStats() : async { totalTenants : Nat; activeTenants : Nat; trialTenants : Nat; suspendedTenants : Nat; expiredTenants : Nat; pendingTenants : Nat; rejectedTenants : Nat } {
    assertAdminPhone(caller);
    TenantLib.getStats(tenants);
  };

  /// Admin only: approve a tenant (sets status to active).
  public shared ({ caller }) func adminApprove(tenantId : CommonTypes.UserId) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    assertAdminPhone(caller);
    switch (TenantLib.approveTenant(tenants, tenantId)) {
      case null #err("Tenant not found");
      case (?view) #ok(view);
    };
  };

  /// Admin only: reject a tenant.
  public shared ({ caller }) func adminReject(tenantId : CommonTypes.UserId) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    assertAdminPhone(caller);
    switch (TenantLib.rejectTenant(tenants, tenantId)) {
      case null #err("Tenant not found");
      case (?view) #ok(view);
    };
  };

  /// Admin only: suspend a tenant.
  public shared ({ caller }) func adminSuspend(tenantId : CommonTypes.UserId) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    assertAdminPhone(caller);
    switch (TenantLib.setStatus(tenants, tenantId, #suspended)) {
      case null #err("Tenant not found");
      case (?view) #ok(view);
    };
  };

  /// Admin only: reactivate a suspended tenant.
  public shared ({ caller }) func adminReactivate(tenantId : CommonTypes.UserId) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    assertAdminPhone(caller);
    switch (TenantLib.setStatus(tenants, tenantId, #active)) {
      case null #err("Tenant not found");
      case (?view) #ok(view);
    };
  };

  /// Admin only: toggle subscription between active and suspended.
  public shared ({ caller }) func adminToggleSubscription(tenantId : CommonTypes.UserId) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    assertAdminPhone(caller);
    switch (tenants.get(tenantId)) {
      case null #err("Tenant not found");
      case (?t) {
        let newStatus : SubTypes.TenantStatus = switch (t.subscriptionStatus) {
          case (#active) #suspended;
          case (_) #active;
        };
        t.subscriptionStatus := newStatus;
        #ok(TenantLib.toView(t));
      };
    };
  };

  /// Admin only: suspend tenant and invalidate access (frontend polling blocks on next refresh).
  public shared ({ caller }) func adminSuspendAndInvalidate(tenantId : CommonTypes.UserId) : async { #ok : SubTypes.AdminTenantView; #err : Text } {
    assertAdminPhone(caller);
    switch (TenantLib.setStatus(tenants, tenantId, #suspended)) {
      case null #err("Tenant not found");
      case (?view) #ok(view);
    };
  };

  /// Admin only: create an activation slot for a phone with a specific 4-digit code.
  public shared ({ caller }) func adminCreateActivationSlot(phone : Text, code : Text) : async { #ok; #err : Text } {
    assertAdminPhone(caller);
    if (code.size() != 4) {
      return #err("Code must be exactly 4 digits");
    };
    activationSlots.add(phone, { code; usedBy = null });
    #ok;
  };

  /// Admin only: generate a random 4-digit code for a phone slot, return the code.
  public shared ({ caller }) func adminGenerateCode(phone : Text) : async { #ok : Text; #err : Text } {
    assertAdminPhone(caller);
    let code = TenantLib.generateCode();
    activationSlots.add(phone, { code; usedBy = null });
    #ok(code);
  };

  /// Admin only: reset existing slot to a new random code and un-claim it, return new code.
  public shared ({ caller }) func adminResetCode(phone : Text) : async { #ok : Text; #err : Text } {
    assertAdminPhone(caller);
    let code = TenantLib.generateCode();
    activationSlots.add(phone, { code; usedBy = null });
    #ok(code);
  };

  /// Admin only: list all activation slots.
  public query ({ caller }) func adminListSlots() : async [SubTypes.ActivationSlotView] {
    assertAdminPhone(caller);
    activationSlots.entries()
      .map<(Text, SubTypes.ActivationSlot), SubTypes.ActivationSlotView>(func((phone, slot)) {
        { phone; code = slot.code; claimed = slot.usedBy != null };
      })
      .toArray();
  };

  /// Admin only: clear all tenant records (keeps invoices and settings intact).
  public shared ({ caller }) func adminClearAllTenants() : async { #ok; #err : Text } {
    assertAdminPhone(caller);
    TenantLib.clearAll(tenants);
    #ok;
  };
};
