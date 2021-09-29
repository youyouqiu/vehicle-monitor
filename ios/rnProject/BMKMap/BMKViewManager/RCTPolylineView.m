//
//  RCTPolylineView.m
//  rnProject
//
//  Created by 敖祥华 on 2018/8/16.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "RCTPolylineView.h"

@interface RCTPolylineView()

@property (nonatomic, assign) NSArray* overlayPoints;
@property (nonatomic, strong) BMKMapView* mapview;

@end

@implementation RCTPolylineView

-(instancetype)initWithMapView:(BMKMapView*)view
{
  self = [super init];
  if(self)
  {
    _mapview = view;
  }
  return self;
}

/**
 * 绘制线
 */
-(void)setOverlayPoints:(NSArray *)points
{
  CLLocationCoordinate2D* coor = malloc(sizeof(CLLocationCoordinate2D) * points.count);
  
  for (int i = 0; i < points.count; i++) {
    NSDictionary *option = [points objectAtIndex:i];
    double lat = [RCTConvert double:option[@"latitude"]];
    double lng = [RCTConvert double:option[@"longitude"]];
    coor[i].latitude = lat;
    coor[i].longitude = lng;
  }
  BMKPolyline* polyline = [BMKPolyline polylineWithCoordinates:coor count:points.count];
  [_mapview addOverlay:polyline];
  
  free(coor);
  
}

/**
 * 绘制线
 */
- (BMKOverlayView *)mapView:(BMKMapView *)mapView viewForOverlay:(id <BMKOverlay>)overlay{
  if ([overlay isKindOfClass:[BMKPolyline class]]){
    BMKPolylineView* polylineView = [[BMKPolylineView alloc] initWithOverlay:overlay];
    polylineView.strokeColor = [UIColor redColor];
    polylineView.lineWidth = 2.0;
    
    return polylineView;
  }
  return nil;
}

@end
