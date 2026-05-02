import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import InvoiceTypes "../types/invoice";
import SubTypes "../types/subscription";
import InvoiceLib "../lib/invoice";

mixin (
  accessControlState : AccessControl.AccessControlState,
  invoices : Map.Map<CommonTypes.InvoiceId, InvoiceTypes.Invoice>,
  invoiceCounter : { var value : Nat },
  tenants : Map.Map<CommonTypes.UserId, SubTypes.Tenant>,
) {
  /// Create a new invoice. Caller must be a registered user or developer.
  /// Suspended or expired tenants are blocked from creating invoices (admin bypass).
  public shared ({ caller }) func createInvoice(args : InvoiceTypes.CreateInvoiceArgs) : async InvoiceTypes.InvoiceView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: must be logged in to create invoices");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isAdmin) {
      switch (tenants.get(caller)) {
        case (?t) {
          switch (t.subscriptionStatus) {
            case (#suspended) Runtime.trap("Account suspended: contact admin to reactivate");
            case (#expired) Runtime.trap("Subscription expired: contact admin to renew");
            case (_) {};
          };
        };
        case null {};
      };
    };
    invoiceCounter.value += 1;
    InvoiceLib.create(invoices, invoiceCounter.value, caller, args);
  };

  /// Get a single invoice by ID. Users see only their own; developers see all.
  public query ({ caller }) func getInvoice(id : CommonTypes.InvoiceId) : async ?InvoiceTypes.InvoiceView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    switch (InvoiceLib.getById(invoices, id)) {
      case null null;
      case (?view) {
        if (isAdmin or Principal.equal(view.owner, caller)) {
          ?view;
        } else {
          Runtime.trap("Unauthorized: not your invoice");
        };
      };
    };
  };

  /// Update invoice fields and/or status.
  public shared ({ caller }) func updateInvoice(args : InvoiceTypes.UpdateInvoiceArgs) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    InvoiceLib.update(invoices, caller, args, isAdmin);
  };

  /// Delete an invoice.
  public shared ({ caller }) func deleteInvoice(id : CommonTypes.InvoiceId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    InvoiceLib.delete(invoices, caller, id, isAdmin);
  };

  /// List invoices for the caller (users see their own; developers see all).
  public query ({ caller }) func listInvoices(filter : InvoiceTypes.InvoiceFilter) : async [InvoiceTypes.InvoiceView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (isAdmin) {
      InvoiceLib.listAll(invoices, filter);
    } else {
      InvoiceLib.listByOwner(invoices, caller, filter);
    };
  };

  /// Developer-only: total invoice count across all users.
  public query ({ caller }) func getInvoiceTotalCount() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    InvoiceLib.totalCount(invoices);
  };

  /// Developer-only: revenue grouped by month.
  public query ({ caller }) func getRevenueByMonth() : async [(Text, Nat)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    InvoiceLib.revenueByMonth(invoices);
  };

  /// Developer-only: invoice status breakdown.
  public query ({ caller }) func getInvoiceStatusBreakdown() : async { draft : Nat; sent : Nat; paid : Nat; cancelled : Nat } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    InvoiceLib.statusBreakdown(invoices);
  };

  /// Developer-only: delete all invoices.
  public shared ({ caller }) func deleteAllInvoices() : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: admin only");
    };
    InvoiceLib.deleteAll(invoices);
    #ok;
  };
};
