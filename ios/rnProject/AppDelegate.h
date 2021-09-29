#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
#import <BaiduMapAPI_Base/BMKBaseComponent.h>
#import <AMapNaviKit/AMapNaviKit.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) BMKMapManager *mapManager;
@property (nonatomic, strong) CLLocationManager *manager;
// @property (nonatomic, assign) CLLocationCoordinate2D userLocation;

//@property (strong, nonatomic) UIViewController *viewController;
@property (nonatomic, strong) UINavigationController *nav;

@property (nonatomic, strong) AMapNaviPoint* startNaviPoint;
//
@property (nonatomic, strong) AMapNaviPoint* endNaviPoint;

@end
