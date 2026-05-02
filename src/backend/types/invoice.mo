import Common "common";

module {
  public type InvoiceStatus = {
    #draft;
    #sent;
    #paid;
    #cancelled;
  };

  public type ServiceItem = {
    name : Text;
    quantity : Nat;
    unitPrice : Nat; // in cents
  };

  public type Invoice = {
    id : Common.InvoiceId;
    owner : Common.UserId;
    patientName : Text;
    services : [ServiceItem];
    practiceDetailsId : ?Common.UserId; // references branding settings owner
    issueDate : Common.Timestamp;
    dueDate : Common.Timestamp;
    gstEnabled : Bool;
    gstPercentage : ?Nat; // e.g. 5, 12, 18 — null or 0 means no GST
    var status : InvoiceStatus;
    createdAt : Common.Timestamp;
    var updatedAt : Common.Timestamp;
  };

  // Shared (immutable) version for API boundary
  public type InvoiceView = {
    id : Common.InvoiceId;
    owner : Common.UserId;
    patientName : Text;
    services : [ServiceItem];
    issueDate : Common.Timestamp;
    dueDate : Common.Timestamp;
    status : InvoiceStatus;
    gstEnabled : Bool;
    gstPercentage : ?Nat;
    gstAmount : Nat; // calculated: subtotal * gstPercentage / 100 when gstEnabled
    total : Nat;     // subtotal + gstAmount (in cents)
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  public type CreateInvoiceArgs = {
    patientName : Text;
    services : [ServiceItem];
    issueDate : Common.Timestamp;
    dueDate : Common.Timestamp;
    gstEnabled : Bool;
    gstPercentage : ?Nat;
  };

  public type UpdateInvoiceArgs = {
    id : Common.InvoiceId;
    patientName : Text;
    services : [ServiceItem];
    issueDate : Common.Timestamp;
    dueDate : Common.Timestamp;
    status : InvoiceStatus;
    gstEnabled : Bool;
    gstPercentage : ?Nat;
  };

  public type InvoiceFilter = {
    patientName : ?Text;
    fromDate : ?Common.Timestamp;
    toDate : ?Common.Timestamp;
  };
};
