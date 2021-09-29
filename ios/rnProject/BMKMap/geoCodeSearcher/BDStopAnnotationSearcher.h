//
//  BDStopAnnotationSearcher.h
//  rnProject
//
//  Created by zwkj on 2019/9/10.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <BaiduMapAPI_Search/BMKGeocodeSearch.h>

@interface BDStopAnnotationSearcher : BMKGeoCodeSearch

@property (nonatomic, assign) int tag;

@end

