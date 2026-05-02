import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import CommonTypes "../types/common";
import InvoiceTypes "../types/invoice";

module {
  func calcSubtotal(services : [InvoiceTypes.ServiceItem]) : Nat {
    var total = 0;
    for (item in services.values()) {
      total += item.quantity * item.unitPrice;
    };
    total;
  };

  func calcGst(subtotal : Nat, gstEnabled : Bool, gstPercentage : ?Nat) : Nat {
    if (not gstEnabled) return 0;
    switch (gstPercentage) {
      case null 0;
      case (?pct) subtotal * pct / 100;
    };
  };

  public func toView(invoice : InvoiceTypes.Invoice) : InvoiceTypes.InvoiceView {
    let subtotal = calcSubtotal(invoice.services);
    let gstAmount = calcGst(subtotal, invoice.gstEnabled, invoice.gstPercentage);
    {
      id = invoice.id;
      owner = invoice.owner;
      patientName = invoice.patientName;
      services = invoice.services;
      issueDate = invoice.issueDate;
      dueDate = invoice.dueDate;
      status = invoice.status;
      gstEnabled = invoice.gstEnabled;
      gstPercentage = invoice.gstPercentage;
      gstAmount;
      total = subtotal + gstAmount;
      createdAt = invoice.createdAt;
      updatedAt = invoice.updatedAt;
    };
  };

  func matchesFilter(invoice : InvoiceTypes.Invoice, filter : InvoiceTypes.InvoiceFilter) : Bool {
    let nameMatch = switch (filter.patientName) {
      case null true;
      case (?name) {
        let lower = invoice.patientName.toLower();
        let searchLower = name.toLower();
        lower.contains(#text searchLower);
      };
    };
    let fromMatch = switch (filter.fromDate) {
      case null true;
      case (?from) invoice.issueDate >= from;
    };
    let toMatch = switch (filter.toDate) {
      case null true;
      case (?to) invoice.issueDate <= to;
    };
    nameMatch and fromMatch and toMatch;
  };

  func invoiceLineTotal(invoice : InvoiceTypes.Invoice) : Nat {
    let subtotal = calcSubtotal(invoice.services);
    let gstAmount = calcGst(subtotal, invoice.gstEnabled, invoice.gstPercentage);
    subtotal + gstAmount;
  };

  public func create(
    invoices : Map.Map<CommonTypes.InvoiceId, InvoiceTypes.Invoice>,
    nextId : Nat,
    caller : CommonTypes.UserId,
    args : InvoiceTypes.CreateInvoiceArgs,
  ) : InvoiceTypes.InvoiceView {
    let now = Time.now();
    let invoice : InvoiceTypes.Invoice = {
      id = nextId;
      owner = caller;
      patientName = args.patientName;
      services = args.services;
      practiceDetailsId = null;
      issueDate = args.issueDate;
      dueDate = args.dueDate;
      gstEnabled = args.gstEnabled;
      gstPercentage = args.gstPercentage;
      var status = #draft;
      createdAt = now;
      var updatedAt = now;
    };
    invoices.add(nextId, invoice);
    toView(invoice);
  };

  public func getById(
    invoices : Map.Map<CommonTypes.InvoiceId, InvoiceTypes.Invoice>,
    id : CommonTypes.InvoiceId,
  ) : ?InvoiceTypes.InvoiceView {
    switch (invoices.get(id)) {
      case null null;
      case (?inv) ?toView(inv);
    };
  };

  public func update(
    invoices : Map.Map<CommonTypes.InvoiceId, InvoiceTypes.Invoice>,
    caller : CommonTypes.UserId,
    args : InvoiceTypes.UpdateInvoiceArgs,
    isAdmin : Bool,
  ) : () {
    switch (invoices.get(args.id)) {
      case null Runtime.trap("Invoice not found");
      case (?inv) {
        if (not isAdmin and not Principal.equal(inv.owner, caller)) {
          Runtime.trap("Unauthorized: not the invoice owner");
        };
        let updated : InvoiceTypes.Invoice = {
          inv with
          patientName = args.patientName;
          services = args.services;
          issueDate = args.issueDate;
          dueDate = args.dueDate;
          gstEnabled = args.gstEnabled;
          gstPercentage = args.gstPercentage;
          var status = args.status;
          var updatedAt = Time.now();
        };
        invoices.add(args.id, updated);
      };
    };
  };

  public func delete(
    invoices : Map.Map<CommonTypes.InvoiceId, InvoiceTypes.Invoice>,
    caller : CommonTypes.UserId,
    id : CommonTypes.InvoiceId,
    isAdmin : Bool,
  ) : () {
    switch (invoices.get(id)) {
      case null Runtime.trap("Invoice not found");
      case (?inv) {
        if (not isAdmin and not Principal.equal(inv.owner, caller)) {
          Runtime.trap("Unauthorized: not the invoice owner");
        };
        invoices.remove(id);
      };
    };
  };

  public func listByOwner(
    invoices : Map.Map<CommonTypes.InvoiceId, InvoiceTypes.Invoice>,
    owner : CommonTypes.UserId,
    filter : InvoiceTypes.InvoiceFilter,
  ) : [InvoiceTypes.InvoiceView] {
    invoices.entries()
      .filter(func((_, inv)) { Principal.equal(inv.owner, owner) and matchesFilter(inv, filter) })
      .map<(CommonTypes.InvoiceId, InvoiceTypes.Invoice), InvoiceTypes.InvoiceView>(func((_, inv)) { toView(inv) })
      .toArray();
  };

  public func listAll(
    invoices : Map.Map<CommonTypes.InvoiceId, InvoiceTypes.Invoice>,
    filter : InvoiceTypes.InvoiceFilter,
  ) : [InvoiceTypes.InvoiceView] {
    invoices.entries()
      .filter(func((_, inv)) { matchesFilter(inv, filter) })
      .map<(CommonTypes.InvoiceId, InvoiceTypes.Invoice), InvoiceTypes.InvoiceView>(func((_, inv)) { toView(inv) })
      .toArray();
  };

  public func totalCount(invoices : Map.Map<CommonTypes.InvoiceId, InvoiceTypes.Invoice>) : Nat {
    invoices.size();
  };

  // Returns array of (monthKey, totalRevenueCents) for paid invoices
  public func revenueByMonth(
    invoices : Map.Map<CommonTypes.InvoiceId, InvoiceTypes.Invoice>
  ) : [(Text, Nat)] {
    let revenueMap = Map.empty<Text, Nat>();
    for ((_, inv) in invoices.entries()) {
      if (inv.status == #paid) {
        let monthKey = monthLabel(inv.issueDate);
        let lineTotal = invoiceLineTotal(inv);
        let prev = switch (revenueMap.get(monthKey)) {
          case null 0;
          case (?v) v;
        };
        revenueMap.add(monthKey, prev + lineTotal);
      };
    };
    revenueMap.toArray();
  };

  // Returns (draft, sent, paid, cancelled) counts
  public func statusBreakdown(
    invoices : Map.Map<CommonTypes.InvoiceId, InvoiceTypes.Invoice>
  ) : { draft : Nat; sent : Nat; paid : Nat; cancelled : Nat } {
    var draft = 0;
    var sent = 0;
    var paid = 0;
    var cancelled = 0;
    for ((_, inv) in invoices.entries()) {
      switch (inv.status) {
        case (#draft) { draft += 1 };
        case (#sent) { sent += 1 };
        case (#paid) { paid += 1 };
        case (#cancelled) { cancelled += 1 };
      };
    };
    { draft; sent; paid; cancelled };
  };

  public func deleteAll(invoices : Map.Map<CommonTypes.InvoiceId, InvoiceTypes.Invoice>) : () {
    invoices.clear();
  };

  // Derive "YYYY-MM" key from a nanosecond timestamp (Int)
  func monthLabel(ts : CommonTypes.Timestamp) : Text {
    let seconds = ts / 1_000_000_000;
    let days = seconds / 86400;
    let daysNat : Nat = if (days < 0) 0 else Int.abs(days);
    let (year, dayOfYear) = daysToYearAndDOY(daysNat);
    let month = dayOfYearToMonth(year, dayOfYear);
    let yearText = year.toText();
    let monthText = if (month < 10) { "0" # month.toText() } else { month.toText() };
    yearText # "-" # monthText;
  };

  func isLeapYear(y : Nat) : Bool {
    (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0);
  };

  func daysInYear(y : Nat) : Nat {
    if (isLeapYear(y)) 366 else 365;
  };

  func daysToYearAndDOY(totalDays : Nat) : (Nat, Nat) {
    var remaining = totalDays;
    var year = 1970;
    label yearLoop while (remaining >= daysInYear(year)) {
      remaining -= daysInYear(year);
      year += 1;
    };
    (year, remaining + 1);
  };

  func dayOfYearToMonth(year : Nat, doy : Nat) : Nat {
    let months : [Nat] = [31, if (isLeapYear(year)) 29 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var rem = doy;
    var m = 1;
    for (days in months.values()) {
      if (rem <= days) {
        return m;
      };
      rem -= days;
      m += 1;
    };
    12;
  };
};
