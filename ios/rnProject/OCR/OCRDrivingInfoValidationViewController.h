//
//  OCRDrivingInfoValidationViewController.h
//  scanning
//
//  Created by zwkj on 2019/6/26.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface OCRDrivingInfoValidationViewController : UIViewController

//@property (nonatomic, strong) UIImage *imageData;
@property (nonatomic, strong) NSArray *vehicleLicensePositiveInfoData;
//@property (nonatomic, strong) NSMutableArray *vehicleLicensePositiveData;
@property (nonatomic, strong) NSArray *vehicleLicenseReverseInfoData;
@property (nonatomic, strong) NSArray *nonFreightCarInfoData;

@end
