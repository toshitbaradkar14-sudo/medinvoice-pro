import Common "common";

module {
  public type PracticeSettings = {
    owner : Common.UserId;
    var practiceName : Text;
    var address : Text;
    var updatedAt : Common.Timestamp;
  };

  public type PracticeSettingsView = {
    owner : Common.UserId;
    practiceName : Text;
    address : Text;
    updatedAt : Common.Timestamp;
  };

  public type SavePracticeSettingsArgs = {
    practiceName : Text;
    address : Text;
  };
};
