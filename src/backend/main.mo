import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import CommonTypes "types/common";
import InvoiceTypes "types/invoice";
import BrandingTypes "types/branding";
import SubTypes "types/subscription";
import InvoiceMixin "mixins/invoice-api";
import BrandingMixin "mixins/branding-api";
import TenantMixin "mixins/tenant-api";



actor {
  // Authorization state (managed by MixinAuthorization)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Invoice state
  let invoices = Map.empty<CommonTypes.InvoiceId, InvoiceTypes.Invoice>();
  let invoiceCounter = { var value : Nat = 0 };

  // Practice branding state
  let practiceSettings = Map.empty<CommonTypes.UserId, BrandingTypes.PracticeSettings>();

  // Tenant/subscription state
  let tenants = Map.empty<CommonTypes.UserId, SubTypes.Tenant>();

  // Activation slots: phone -> {code, usedBy}
  let activationSlots = Map.empty<Text, SubTypes.ActivationSlot>();

  // Migration flag: cleared once on first startup after deploy
  let migrationDone = { var value : Bool = false };

  // Include domain mixins
  include InvoiceMixin(accessControlState, invoices, invoiceCounter, tenants);
  include BrandingMixin(accessControlState, practiceSettings);
  include TenantMixin(accessControlState, tenants, invoices, practiceSettings, activationSlots, migrationDone);
};
