//
//  BDStopAnnotation.h
//  rnProject
//
//  Created by zwkj on 2019/9/10.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <BaiduMapAPI_Map/BMKPointAnnotation.h>

@interface BDStopAnnotation : BMKPointAnnotation

@property (nonatomic, assign) int index;
@property (nonatomic, copy) NSString *type;

@end

