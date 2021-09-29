//
//  CACoordLayer.h
//

#import <BaiduMapAPI_Map/BMKMapComponent.h>
#import <BaiduMapAPI_Utils/BMKUtilsComponent.h>
#import "CustomBMKAnnotation.h"
#import "SportBMKAnnotation.h"

@interface CACoordLayer : CALayer

@property (nonatomic, strong) BMKMapView *mapView;

//定义一个BMKAnnotation对象
@property (nonatomic, strong) CustomBMKAnnotation *annotation;

@property (nonatomic) double mapx;

@property (nonatomic) double mapy;

@property (nonatomic) CGPoint centerOffset;

-(void)clearData:(BMKPointAnnotation*)annotation;

@end
