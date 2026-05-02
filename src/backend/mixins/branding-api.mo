import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import BrandingTypes "../types/branding";
import BrandingLib "../lib/branding";

mixin (
  accessControlState : AccessControl.AccessControlState,
  practiceSettings : Map.Map<CommonTypes.UserId, BrandingTypes.PracticeSettings>,
) {
  /// Save (upsert) practice branding settings for the caller.
  public shared ({ caller }) func savePracticeSettings(args : BrandingTypes.SavePracticeSettingsArgs) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: must be logged in");
    };
    BrandingLib.save(practiceSettings, caller, args);
  };

  /// Get the caller's practice settings.
  public query ({ caller }) func getCallerPracticeSettings() : async ?BrandingTypes.PracticeSettingsView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: must be logged in");
    };
    BrandingLib.get(practiceSettings, caller);
  };

  /// Developer-only: get practice settings for any user (used in global analytics / dashboard).
  public query ({ caller }) func getPracticeSettings(owner : CommonTypes.UserId) : async ?BrandingTypes.PracticeSettingsView {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    BrandingLib.get(practiceSettings, owner);
  };
};
