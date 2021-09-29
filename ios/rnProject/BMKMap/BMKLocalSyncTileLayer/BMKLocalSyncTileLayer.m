//
//  BMKLocalSyncTileLayer.m
//  rnProject
//
//  Created by zwkj on 2019/5/22.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "BMKLocalSyncTileLayer.h"

@implementation BMKLocalSyncTileLayer

- (UIImage *)tileForX:(NSInteger)x y:(NSInteger)y zoom:(NSInteger)zoom {
  long xx = 0;
  long yy = 0;
  long zooms = 0;
//  if (zoom == 19) {
//    xx = 215572 + (x - 101234);
//    yy = 98745 - (y - 37702);
//    zooms = zoom - 1;
//  }
  
//  if (zoom == 18) {
//    xx = 107786 + (x - 50617);
//    yy = 49372 - (y - 18851);
//    zooms = zoom - 1;
//  }
//    if (zoom == 19) {
//      xx = 215576 + (x - 101234);
//      yy = 98745 - (y - 37702);
//      zooms = zoom - 1;
//    }
  
  
//  NSString *imagePath = [NSString stringWithFormat:@"image/14/13590/6379.jpg", zooms, xx, yy];
  
  NSString *imageName = [NSString stringWithFormat:@"%ld_%ld_%ld.jpg", xx, yy, zooms];
  UIImage *image = [UIImage imageNamed:imageName];
//  UIImage *image = [UIImage imageWithContentsOfFile:imagePath];
  return image;
}

@end
