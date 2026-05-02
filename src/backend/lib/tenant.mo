import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import CommonTypes "../types/common";
import SubTypes "../types/subscription";

module {
  // 14 days in nanoseconds (14 * 24 * 60 * 60 * 1_000_000_000)
  let TRIAL_DURATION_NS : Int = 1_209_600_000_000_000;

  public func toView(tenant : SubTypes.Tenant) : SubTypes.AdminTenantView {
    {
      id = tenant.id;
      shopName = tenant.shopName;
      phone = tenant.phone;
      createdAt = tenant.createdAt;
      trialEndsAt = tenant.trialEndsAt;
      subscriptionStatus = tenant.subscriptionStatus;
      subscriptionExpiresAt = tenant.subscriptionExpiresAt;
      cashPaidAt = tenant.cashPaidAt;
      cashPaidNote = tenant.cashPaidNote;
      approvalCode = tenant.approvalCode;
    };
  };

  public func register(
    tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>,
    caller : CommonTypes.UserId,
    shopName : Text,
    phone : Text,
  ) : SubTypes.AdminTenantView {
    // Idempotent: return existing tenant if already registered
    switch (tenants.get(caller)) {
      case (?existing) { toView(existing) };
      case null {
        let now = Time.now();
        let approvalCode = Int.abs(now) % 9000 + 1000;
        let tenant : SubTypes.Tenant = {
          id = caller;
          shopName;
          phone;
          createdAt = now;
          trialEndsAt = now + TRIAL_DURATION_NS;
          var subscriptionStatus = #pending;
          var subscriptionExpiresAt = null;
          var cashPaidAt = null;
          var cashPaidNote = "";
          approvalCode = approvalCode.toText();
        };
        tenants.add(caller, tenant);
        toView(tenant);
      };
    };
  };

  public func getStatus(
    tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>,
    caller : CommonTypes.UserId,
  ) : ?SubTypes.TenantStatus {
    switch (tenants.get(caller)) {
      case null null;
      case (?t) ?t.subscriptionStatus;
    };
  };

  public func listAll(
    tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>,
    search : ?Text,
  ) : [SubTypes.AdminTenantView] {
    tenants.entries()
      .filter(func((_, t)) {
        switch (search) {
          case null true;
          case (?q) {
            let lower = q.toLower();
            t.shopName.toLower().contains(#text lower) or t.phone.toLower().contains(#text lower);
          };
        };
      })
      .map<(CommonTypes.UserId, SubTypes.Tenant), SubTypes.AdminTenantView>(func((_, t)) { toView(t) })
      .toArray();
  };

  public func getById(
    tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>,
    tenantId : CommonTypes.UserId,
  ) : ?SubTypes.AdminTenantView {
    switch (tenants.get(tenantId)) {
      case null null;
      case (?t) ?toView(t);
    };
  };

  public func setStatus(
    tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>,
    tenantId : CommonTypes.UserId,
    status : SubTypes.TenantStatus,
  ) : ?SubTypes.AdminTenantView {
    switch (tenants.get(tenantId)) {
      case null null;
      case (?t) {
        t.subscriptionStatus := status;
        ?toView(t);
      };
    };
  };

  public func extendExpiry(
    tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>,
    tenantId : CommonTypes.UserId,
    newExpiresAt : CommonTypes.Timestamp,
  ) : ?SubTypes.AdminTenantView {
    switch (tenants.get(tenantId)) {
      case null null;
      case (?t) {
        t.subscriptionExpiresAt := ?newExpiresAt;
        ?toView(t);
      };
    };
  };

  public func markCashPaid(
    tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>,
    tenantId : CommonTypes.UserId,
    note : Text,
  ) : ?SubTypes.AdminTenantView {
    switch (tenants.get(tenantId)) {
      case null null;
      case (?t) {
        t.cashPaidAt := ?Time.now();
        t.cashPaidNote := note;
        t.subscriptionStatus := #active;
        ?toView(t);
      };
    };
  };

  public func getStats(
    tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>
  ) : { totalTenants : Nat; activeTenants : Nat; trialTenants : Nat; suspendedTenants : Nat; expiredTenants : Nat; pendingTenants : Nat; rejectedTenants : Nat } {
    var total = 0;
    var active = 0;
    var trial = 0;
    var suspended = 0;
    var expired = 0;
    var pending = 0;
    var rejected = 0;
    for ((_, t) in tenants.entries()) {
      total += 1;
      switch (t.subscriptionStatus) {
        case (#active) { active += 1 };
        case (#trial) { trial += 1 };
        case (#suspended) { suspended += 1 };
        case (#expired) { expired += 1 };
        case (#pending) { pending += 1 };
        case (#rejected) { rejected += 1 };
      };
    };
    { totalTenants = total; activeTenants = active; trialTenants = trial; suspendedTenants = suspended; expiredTenants = expired; pendingTenants = pending; rejectedTenants = rejected };
  };

  /// Approve a pending tenant — sets status to active.
  public func approveTenant(
    tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>,
    tenantId : CommonTypes.UserId,
  ) : ?SubTypes.AdminTenantView {
    switch (tenants.get(tenantId)) {
      case null null;
      case (?t) {
        t.subscriptionStatus := #active;
        ?toView(t);
      };
    };
  };

  /// Reject a tenant — sets status to rejected.
  public func rejectTenant(
    tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>,
    tenantId : CommonTypes.UserId,
  ) : ?SubTypes.AdminTenantView {
    switch (tenants.get(tenantId)) {
      case null null;
      case (?t) {
        t.subscriptionStatus := #rejected;
        ?toView(t);
      };
    };
  };

  /// Check if the given phone matches the admin phone.
  public func isAdminPhone(phone : Text, adminPhone : Text) : Bool {
    phone == adminPhone;
  };

  /// Clear all tenants from the map. Does NOT touch invoices or settings.
  public func clearAll(
    tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>
  ) {
    tenants.clear();
  };

  /// Generate a random 4-digit code derived from current time.
  public func generateCode() : Text {
    let code = Int.abs(Time.now()) % 9000 + 1000;
    code.toText();
  };

  /// Activate with code: matches phone+code in slots, creates tenant record for caller.
  public func activateWithCode(
    tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>,
    slots : Map.Map<Text, SubTypes.ActivationSlot>,
    caller : CommonTypes.UserId,
    phone : Text,
    code : Text,
    shopName : Text,
  ) : { #ok : SubTypes.AdminTenantView; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Must be logged in");
    };
    switch (slots.get(phone)) {
      case null #err("No activation slot found for this phone number");
      case (?slot) {
        if (slot.code != code) {
          return #err("Invalid activation code");
        };
        switch (slot.usedBy) {
          case (?_) return #err("This activation code has already been used");
          case null {};
        };
        // Check if caller already has a tenant record
        switch (tenants.get(caller)) {
          case (?existing) { return #ok(toView(existing)) };
          case null {};
        };
        let now = Time.now();
        let tenant : SubTypes.Tenant = {
          id = caller;
          shopName;
          phone;
          createdAt = now;
          trialEndsAt = now + TRIAL_DURATION_NS;
          var subscriptionStatus = #pending;
          var subscriptionExpiresAt = null;
          var cashPaidAt = null;
          var cashPaidNote = "";
          approvalCode = code;
        };
        tenants.add(caller, tenant);
        // Mark slot as used
        slots.add(phone, { slot with usedBy = ?caller });
        #ok(toView(tenant));
      };
    };
  };
};
