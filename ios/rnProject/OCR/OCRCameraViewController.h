//
//  OCRCameraViewController.h
//  scanning
//
//  Created by zwkj on 2019/6/20.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface OCRCameraViewController : UIViewController

/**
 * type
 * 1 || 11 身份证
 * 2 行驶证正本
 * 3 行驶证副本
 * 4 道路运输证
 * 5 从业人员资格证
 * 6 行驶证正本
 * 7 车辆照片
 */
@property (nonatomic, assign) int type;

@end

NS_ASSUME_NONNULL_END
