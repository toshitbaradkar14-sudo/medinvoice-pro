import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import CommonTypes "../types/common";
import BrandingTypes "../types/branding";

module {
  public func toView(s : BrandingTypes.PracticeSettings) : BrandingTypes.PracticeSettingsView {
    {
      owner = s.owner;
      practiceName = s.practiceName;
      address = s.address;
      updatedAt = s.updatedAt;
    };
  };

  public func save(
    settings : Map.Map<CommonTypes.UserId, BrandingTypes.PracticeSettings>,
    owner : CommonTypes.UserId,
    args : BrandingTypes.SavePracticeSettingsArgs,
  ) : () {
    switch (settings.get(owner)) {
      case (?existing) {
        existing.practiceName := args.practiceName;
        existing.address := args.address;
        existing.updatedAt := Time.now();
      };
      case null {
        let record : BrandingTypes.PracticeSettings = {
          owner;
          var practiceName = args.practiceName;
          var address = args.address;
          var updatedAt = Time.now();
        };
        settings.add(owner, record);
      };
    };
  };

  public func get(
    settings : Map.Map<CommonTypes.UserId, BrandingTypes.PracticeSettings>,
    owner : CommonTypes.UserId,
  ) : ?BrandingTypes.PracticeSettingsView {
    switch (settings.get(owner)) {
      case null null;
      case (?s) ?toView(s);
    };
  };
};
