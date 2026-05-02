import CommonTypes "common";


module {
  public type TenantStatus = {
    #trial;
    #active;
    #suspended;
    #expired;
    #pending;
    #rejected;
  };

  public type ActivationSlot = {
    code : Text;
    usedBy : ?CommonTypes.UserId;
  };

  public type ActivationSlotView = {
    phone : Text;
    code : Text;
    claimed : Bool;
  };

  public type Tenant = {
    id : CommonTypes.UserId;
    shopName : Text;
    phone : Text;
    createdAt : CommonTypes.Timestamp;
    trialEndsAt : CommonTypes.Timestamp;
    var subscriptionStatus : TenantStatus;
    var subscriptionExpiresAt : ?CommonTypes.Timestamp;
    var cashPaidAt : ?CommonTypes.Timestamp;
    var cashPaidNote : Text;
    approvalCode : Text;
  };

  public type AdminTenantView = {
    id : CommonTypes.UserId;
    shopName : Text;
    phone : Text;
    createdAt : CommonTypes.Timestamp;
    trialEndsAt : CommonTypes.Timestamp;
    subscriptionStatus : TenantStatus;
    subscriptionExpiresAt : ?CommonTypes.Timestamp;
    cashPaidAt : ?CommonTypes.Timestamp;
    cashPaidNote : Text;
    approvalCode : Text;
  };
};
