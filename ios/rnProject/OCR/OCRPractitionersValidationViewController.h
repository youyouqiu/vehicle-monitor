//
//  OCRPractitionersValidationViewController.h
//  scanning
//
//  Created by zwkj on 2019/7/1.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface OCRPractitionersValidationViewController : UIViewController

//@property (nonatomic, strong) UIImage *imageData;
@property (nonatomic, strong) NSArray *idCardInfoData;
@property (nonatomic, strong) NSArray *driverLicenseInfoData;
@property (nonatomic, strong) NSArray *qualificationCertificateInfoData;

@end

NS_ASSUME_NONNULL_END
