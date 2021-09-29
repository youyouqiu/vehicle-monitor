//
//  MovingAnnotationView.m
//

#import "MovingAnnotationView.h"
#import "CACoordLayer.h"
#import "UIImageView+WebCache.h"
//#import "Util.h"

#define TurnAnimationDuration 0.1

#define MapXAnimationKey @"mapx"
#define MapYAnimationKey @"mapy"
#define RotationAnimationKey @"transform.rotation.z"

#define kCalloutWidth     20
#define kCalloutHeight    20

@interface MovingAnnotationView()

@property (nonatomic, strong) NSMutableArray * animationList;

@end

@implementation MovingAnnotationView
{
    BMKMapPoint currDestination;
    BMKMapPoint lastDestination;
    BOOL isAnimatingX, isAnimatingY;
    NSInteger animateCompleteTimes;
    BOOL pointChangeState;
    CLLocationCoordinate2D hopsCoordinate;
}
@synthesize animateDelegate = _animateDelegate;

#pragma mark - Animation
+ (Class)layerClass
{
    return [CACoordLayer class];
}

- (void)addTrackingAnimationForPoints:(NSArray *)points duration:(CFTimeInterval)duration
{

    if (![points count])
    {
        return;
    }
    
    CACoordLayer * mylayer = ((CACoordLayer *)self.layer);
    
    //preparing
    NSUInteger num = 2*[points count] + 1;
    NSMutableArray * xvalues = [NSMutableArray arrayWithCapacity:num];
    NSMutableArray *yvalues = [NSMutableArray arrayWithCapacity:num];
    
    NSMutableArray * times = [NSMutableArray arrayWithCapacity:num];
    
    double sumOfDistance = 0.f;
    double * dis = malloc(([points count]) * sizeof(double));
    
    //the first point is set by the destination of last animation.
    BMKMapPoint preLoc;
    if (!([self.animationList count] > 0 || isAnimatingX || isAnimatingY))
    {
        lastDestination = BMKMapPointMake(mylayer.mapx, mylayer.mapy);
    }
    preLoc = lastDestination;
        
    [xvalues addObject:@(preLoc.x)];
    [yvalues addObject:@(preLoc.y)];
    [times addObject:@(0.f)];
  
    NSUInteger pointsNum = [points count];
    //set the animation points.
    for (int i = 0; i < pointsNum; i++)
    {
        TracingPoint * tp = points[i];
        
        //position
        BMKMapPoint p = BMKMapPointForCoordinate(tp.coordinate);
        [xvalues addObjectsFromArray:@[@(p.x), @(p.x)]];//stop for turn
        [yvalues addObjectsFromArray:@[@(p.y), @(p.y)]];
        
        //distance
        dis[i] = BMKMetersBetweenMapPoints(p, preLoc);
        sumOfDistance = sumOfDistance + dis[i];
        dis[i] = sumOfDistance;
        
        //record pre
        preLoc = p;
    }
    
    //set the animation times.
    double preTime = 0.f;
    double turnDuration = TurnAnimationDuration/duration;
    for (int i = 0; i < pointsNum; i++)
    {
        double turnEnd = dis[i]/sumOfDistance;
        double turnStart = (preTime > turnEnd - turnDuration) ? (turnEnd + preTime) * 0.5 : turnEnd - turnDuration;
        
        [times addObjectsFromArray:@[@(turnStart), @(turnEnd)]];

        preTime = turnEnd;
    }
    
    //record the destination.
    TracingPoint * last = [points lastObject];
    lastDestination = BMKMapPointForCoordinate(last.coordinate);

    free(dis);
    
    // add animation.
    CAKeyframeAnimation *xanimation = [CAKeyframeAnimation animationWithKeyPath:MapXAnimationKey];
  // 匀速
    xanimation.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
    xanimation.values   = xvalues;
    xanimation.keyTimes = times;
    xanimation.duration = duration;
    xanimation.delegate = self;
//    xanimation.removedOnCompletion = NO;
  // xanimation.repeatDuration = 1;
    xanimation.fillMode = kCAFillModeForwards;
  
    CAKeyframeAnimation *yanimation = [CAKeyframeAnimation animationWithKeyPath:MapYAnimationKey];
    yanimation.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
    yanimation.values   = yvalues;
    yanimation.keyTimes = times;
    yanimation.duration = duration;
    yanimation.delegate = self;
//    yanimation.removedOnCompletion = NO;
  // yanimation.repeatDuration = 1;
    yanimation.fillMode = kCAFillModeForwards;
  NSLog(@"开始进行移动");
    [self pushBackAnimation:xanimation];
    [self pushBackAnimation:yanimation];
    mylayer.mapView = [self mapView];
    // mylayer.mapx = lastDestination.x;
    // mylayer.mapy = lastDestination.y;
}

- (void)pushBackAnimation:(CAPropertyAnimation *)anim
{
    [self.animationList addObject:anim];

    if ([self.layer animationForKey:anim.keyPath] == nil)
    {
        [self popFrontAnimationForKey:anim.keyPath];
    }
}

- (void)popFrontAnimationForKey:(NSString *)key
{
    [self.animationList enumerateObjectsUsingBlock:^(CAKeyframeAnimation * obj, NSUInteger idx, BOOL *stop)
     {
       
         if ([obj.keyPath isEqualToString:key])
         {
           NSLog(@"11112标注物移动的pop处理");
           // NSLog(@"%@", obj.keyPath);
           [self.layer addAnimation:obj forKey:obj.keyPath];
           [self.animationList removeObject:obj];

           if ([key isEqualToString:MapXAnimationKey])
           {
               isAnimatingX = YES;
           }
           else if([key isEqualToString:MapYAnimationKey])
           {
               isAnimatingY = YES;
           }
           *stop = YES;
         }
     }];
}

#pragma mark - Animation Delegate

- (void)animationDidStop:(CAAnimation *)anim finished:(BOOL)flag
{
    if ([anim isKindOfClass:[CAKeyframeAnimation class]])
    {
        CAKeyframeAnimation * keyAnim = ((CAKeyframeAnimation *)anim);
        if ([keyAnim.keyPath isEqualToString:MapXAnimationKey])
        {
            isAnimatingX = NO;
          NSLog(@"11112X移动完成");
            CACoordLayer * mylayer = ((CACoordLayer *)self.layer);
            mylayer.mapx = ((NSNumber *)[keyAnim.values lastObject]).doubleValue;
            currDestination.x = mylayer.mapx;
            [self updateAnnotationCoordinate];
        }
        else if ([keyAnim.keyPath isEqualToString:MapYAnimationKey])
        {
            isAnimatingY = NO;
            CACoordLayer * mylayer = ((CACoordLayer *)self.layer);
            mylayer.mapy = ((NSNumber *)[keyAnim.values lastObject]).doubleValue;
            currDestination.y = mylayer.mapy;
            [self updateAnnotationCoordinate];
        }
        animateCompleteTimes++;
        if (animateCompleteTimes % 2 == 0) {
          if (_animateDelegate && [_animateDelegate respondsToSelector:@selector(annotationHopsFinished:)]) {
            CACoordLayer * mylayer = ((CACoordLayer *)self.layer);
            [mylayer clearData:self.annotation];
            [_animateDelegate annotationHopsFinished:self.annotation];
          }
          
          if (_animateDelegate && [_animateDelegate respondsToSelector:@selector(movingAnnotationViewAnimationFinished:)]) {
            [_animateDelegate movingAnnotationViewAnimationFinished:self.annotation];
          }
          
        }
    }
}


- (void)updateAnnotationCoordinate
{
    if (! (isAnimatingX || isAnimatingY) )
    {
       NSLog(@"11112移动结束后更新经纬度值");
      self.annotation.coordinate = BMKCoordinateForMapPoint(currDestination);
    }
}

#pragma mark - Property

- (NSMutableArray *)animationList
{
    if (_animationList == nil)
    {
        _animationList = [NSMutableArray array];
    }
    return _animationList;
}

- (BMKMapView *)mapView
{
    return (BMKMapView*)(self.superview.superview.superview.superview);
}

#pragma mark - Override

- (void)setCenterOffset:(CGPoint)centerOffset
{
    CACoordLayer * mylayer = ((CACoordLayer *)self.layer);
    mylayer.centerOffset = centerOffset;
    [super setCenterOffset:centerOffset];
}

#pragma mark - Life Cycle

- (id)initWithAnnotation:(id<BMKAnnotation>)annotation reuseIdentifier:(NSString *)reuseIdentifier
{
    self = [super initWithAnnotation:annotation reuseIdentifier:reuseIdentifier];
    if (self)
    {
        if ([annotation isKindOfClass:[CustomBMKAnnotation class]]){
          CustomBMKAnnotation* customAnnotation = annotation;
          [self setBounds:CGRectMake(0.f, 0.f, 40.f, 40.f)];
          
          // NSData * data = [NSData dataWithContentsOfURL:[NSURL URLWithString:customAnnotation.icon]];
          if ([customAnnotation.pointType isEqual:@"wake"]) {
            _imageView = [[UIImageView alloc] initWithFrame:CGRectMake(-20.f, -20.f, 40.f, 40.f)];
          } else {
            _imageView = [[UIImageView alloc] initWithFrame:CGRectMake(0.f, 0.f, 40.f, 40.f)];
          }
          // _imageView.image = [UIImage imageNamed:@"sportarrow.png"];
          
          [self.imageView sd_setImageWithURL:[NSURL URLWithString:customAnnotation.icon]];
          
          // _imageView.image = [UIImage imageWithData:data];
          _imageView.contentMode = UIViewContentModeScaleAspectFit;
          
          
          // _imageView.backgroundColor = [UIColor blueColor];
          // _imageView.layer.zPosition = -1;
          [self addSubview:_imageView];
          CACoordLayer * mylayer = ((CACoordLayer *)self.layer);
          BMKMapPoint mapPoint = BMKMapPointForCoordinate(annotation.coordinate);
          mylayer.mapx = mapPoint.x;
          mylayer.mapy = mapPoint.y;
          
          //初始化CACoordLayer定义的BMKAnnotation对象
          mylayer.annotation = self.annotation;
          
          mylayer.centerOffset = self.centerOffset;
          
          isAnimatingX = NO;
          isAnimatingY = NO;
          _monitorId = customAnnotation.markerId;
        } else if ([annotation isKindOfClass:[SportBMKAnnotation class]]) {
          SportBMKAnnotation *sportAnnotation = annotation;
          [self setBounds:CGRectMake(0.f, 0.f, 40.f, 40.f)];
          if ([sportAnnotation.type  isEqual: @"monitor"]) {
            _imageView = [[UIImageView alloc] initWithFrame:CGRectMake(-20.f, -20.f, 40.f, 40.f)];
            _imageView.contentMode = UIViewContentModeScaleAspectFit;
            NSData * data = [NSData dataWithContentsOfURL:[NSURL URLWithString:sportAnnotation.icon]];
            _imageView.image = [UIImage imageWithData:data];
          } else if ([sportAnnotation.type  isEqual: @"start"]) {
            _imageView = [[UIImageView alloc] initWithFrame:CGRectMake(-20.f, -40.f, 40.f, 40.f)];
            _imageView.contentMode = UIViewContentModeScaleAspectFit;
            _imageView.image = [UIImage imageNamed:@"startPoint.png"];
          } else if ([sportAnnotation.type  isEqual: @"end"]) {
            _imageView = [[UIImageView alloc] initWithFrame:CGRectMake(-20.f, -40.f, 40.f, 40.f)];
            _imageView.contentMode = UIViewContentModeScaleAspectFit;
            _imageView.image = [UIImage imageNamed:@"endPoint.png"];
          }
          [self addSubview:_imageView];
          CACoordLayer * mylayer = ((CACoordLayer *)self.layer);
          BMKMapPoint mapPoint = BMKMapPointForCoordinate(annotation.coordinate);
          mylayer.mapx = mapPoint.x;
          mylayer.mapy = mapPoint.y;
          
          //初始化CACoordLayer定义的BMKAnnotation对象
          mylayer.annotation = self.annotation;
          
          mylayer.centerOffset = self.centerOffset;
          
          isAnimatingX = NO;
          isAnimatingY = NO;
        }
    }
    return self;
}

/**
 * 标注物暂停移动
 */
-(void)layerStop
{
  CFTimeInterval pauseTime = [self.layer convertTime:CACurrentMediaTime() fromLayer:nil];
  self.layer.timeOffset = pauseTime;
  self.layer.speed = 0;
}

/**
 * 标注物恢复移动
 */
-(void)resumeLayer
{
  // 时间转换
  CFTimeInterval pauseTime = self.layer.timeOffset;
  // 计算暂停时间
  CFTimeInterval timeSincePause = CACurrentMediaTime() - pauseTime;
  // 取消
  self.layer.timeOffset = 0;
  // local time相对于parent time世界的beginTime
  self.layer.beginTime = timeSincePause;
  // 继续
  self.layer.speed = 1;
   pointChangeState = NO;
}

/**
 * 标注物移除动画
 */
-(void)removeLayer:(CLLocationCoordinate2D)coordinate
{
  [self.layer removeAnimationForKey:@"mapx"];
  [self.layer removeAnimationForKey:@"mapy"];
  hopsCoordinate = coordinate;
  pointChangeState = YES;
  CACoordLayer * mylayer = ((CACoordLayer *)self.layer);
  BMKMapPoint mapPoint = BMKMapPointForCoordinate(coordinate);
  mylayer.mapx = mapPoint.x;
  mylayer.mapy = mapPoint.y;
}

/**
 * 设置mapx和mapy
 */
-(void)setMapPoint:(CLLocationCoordinate2D)coordinate
{
//  hopsCoordinate = coordinate;
//  pointChangeState = YES;
  CACoordLayer * mylayer = ((CACoordLayer *)self.layer);
  BMKMapPoint mapPoint = BMKMapPointForCoordinate(coordinate);
  mylayer.mapx = mapPoint.x;
  mylayer.mapy = mapPoint.y;
}

//-(void)initRemoveLayer
//{
//  [self.layer removeAnimationForKey:@"mapx"];
//  [self.layer removeAnimationForKey:@"mapy"];
//}

@end
