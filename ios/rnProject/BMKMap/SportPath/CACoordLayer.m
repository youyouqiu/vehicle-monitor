//
//  CACoordLayer.m
//

#import "CACoordLayer.h"

@interface  CACoordLayer()

@property (nonatomic, strong) NSMutableArray* weakPoints;
@property (nonatomic, strong) BMKPolyline* polyline;

@end

@implementation CACoordLayer

@dynamic mapx;
@dynamic mapy;

- (id)initWithLayer:(id)layer
{
    if ((self = [super initWithLayer:layer]))
    {
        if ([layer isKindOfClass:[CACoordLayer class]])
        {
            CACoordLayer * input = layer;
            self.mapx = input.mapx;
            self.mapy = input.mapy;
            [self setNeedsDisplay];
        }
    }
    return self;
}

+ (BOOL)needsDisplayForKey:(NSString *)key
{
    if ([@"mapx" isEqualToString:key])
    {
        return YES;
    }
    if ([@"mapy" isEqualToString:key])
    {
        return YES;
    }
    
    return [super needsDisplayForKey:key];
}

- (void)display
{
    CACoordLayer * layer = [self presentationLayer];
  // CACoordLayer * layer = self.presentationLayer;
    // if (layer.mapView) {
      if ([self.annotation isKindOfClass:[CustomBMKAnnotation class]]){
        CustomBMKAnnotation* annotation = self.annotation;
        // 判断是否为聚焦跟踪车辆
        if (annotation.tracking) {
          // CGRect rect = [self.mapView convertRect:self.frame toView:self.mapView];
          // CGRect rect2 = self.mapView.bounds;
          // rect2.size.height -= 100;
          // if (!CGRectContainsRect(rect2, rect)) {
            self.mapView.centerCoordinate = annotation.coordinate;
          // };
        }
        
        // 实时尾迹划线
        if ([annotation.pointType isEqual:@"wake"]) {
          if (!_weakPoints) {
            _weakPoints = [[NSMutableArray alloc] init];
          }
          NSNumber *lat = [[NSNumber alloc] initWithDouble:annotation.coordinate.latitude];
          NSNumber *lng = [[NSNumber alloc] initWithDouble:annotation.coordinate.longitude];
          NSMutableDictionary *option = [[NSMutableDictionary alloc] init];
          [option setObject:lat forKey:@"latitude"];
          [option setObject:lng forKey:@"longitude"];
          [_weakPoints addObject:option];
          
          CLLocationCoordinate2D paths[_weakPoints.count];
          for (NSInteger j = 0; j < _weakPoints.count; j++) {
            NSMutableDictionary *o = _weakPoints[j];
            CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake([o[@"latitude"] doubleValue], [o[@"longitude"] doubleValue]);
            paths[j] = coordinate;
          }
          if (_polyline) {
            NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:3], nil];
            [_polyline setPolylineWithCoordinates:paths count:_weakPoints.count textureIndex:colorIndexs];
          } else {
            NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:3], nil];
            _polyline = [BMKPolyline polylineWithCoordinates:paths count:_weakPoints.count textureIndex:colorIndexs];
            [self.mapView addOverlay:_polyline];
          }
        }

        if (!(isnan(layer.mapx) || isnan(layer.mapy))) {
          BMKMapPoint mappoint = BMKMapPointMake(layer.mapx, layer.mapy);
          //根据得到的坐标值，将其设置为annotation的经纬度
          self.annotation.coordinate = BMKCoordinateForMapPoint(mappoint);
          //设置layer的位置，显示动画
          CGPoint center = [self.mapView convertCoordinate:BMKCoordinateForMapPoint(mappoint) toPointToView:self.mapView];
         
          self.position = center;
        }
      } else if ([self.annotation isKindOfClass:[SportBMKAnnotation class]]) {
        SportBMKAnnotation* annotation = (SportBMKAnnotation*)self.annotation;
        if (!annotation.mapPointType) {
          CGRect rect = [self.mapView convertRect:self.frame toView:self.mapView];
          CGRect rect2 = self.mapView.bounds;
          rect2.size.height -= 100;
          if (!CGRectContainsRect(rect2, rect)) {
            self.mapView.centerCoordinate = self.annotation.coordinate;
          };
          if (!(isnan(layer.mapx) || isnan(layer.mapy))) {
            BMKMapPoint mappoint = BMKMapPointMake(layer.mapx, layer.mapy);
            //根据得到的坐标值，将其设置为annotation的经纬度
            self.annotation.coordinate = BMKCoordinateForMapPoint(mappoint);
            //设置layer的位置，显示动画
            CGPoint center = [self.mapView convertCoordinate:BMKCoordinateForMapPoint(mappoint) toPointToView:self.mapView];
            self.position = center;
          }
        } else {
          annotation.mapPointType = NO;
        }
        // 轨迹回放移动点划线
        if (!_weakPoints) {
          _weakPoints = [[NSMutableArray alloc] init];
        }
        NSNumber *lat = [[NSNumber alloc] initWithDouble:annotation.coordinate.latitude];
        NSNumber *lng = [[NSNumber alloc] initWithDouble:annotation.coordinate.longitude];
        NSMutableDictionary *option = [[NSMutableDictionary alloc] init];
        [option setObject:lat forKey:@"latitude"];
        [option setObject:lng forKey:@"longitude"];
        [_weakPoints addObject:option];
        
        CLLocationCoordinate2D paths[_weakPoints.count];
        for (NSInteger j = 0; j < _weakPoints.count; j++) {
          NSMutableDictionary *o = _weakPoints[j];
          CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake([o[@"latitude"] doubleValue], [o[@"longitude"] doubleValue]);
          paths[j] = coordinate;
        }
        if (_polyline) {
          NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:4], nil];
          [_polyline setPolylineWithCoordinates:paths count:_weakPoints.count textureIndex:colorIndexs];
        } else {
          NSArray *colorIndexs = [NSArray arrayWithObjects:[NSNumber numberWithInt:4], nil];
          _polyline = [BMKPolyline polylineWithCoordinates:paths count:_weakPoints.count textureIndex:colorIndexs];
          [self.mapView addOverlay:_polyline];
        }
      }
}

-(void)clearData:(BMKPointAnnotation*)annotation
{
  [_weakPoints removeAllObjects];
  _polyline = nil;
}

@end


