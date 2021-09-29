//
//  NSString+Category.h
//  scanning
//
//  Created by zwkj on 2019/7/1.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NSString (Category)

- (NSString *)subBytesOfstringToIndex:(NSInteger)index;

- (BOOL)validateEng; // 验证是否为英文

- (BOOL)validateChineseEng; // 验证是否为中英文

- (BOOL)validateIdCard; // 验证是否为身份证

- (BOOL)validateEngNumber; // 验证输入的是否为字母或数字

- (BOOL)validateChineseEngNumber; // 验证输入的是否为汉字、字母或数字

-(NSString *)renturnGender;

-(NSString *)renturnGenderValue;

@end

NS_ASSUME_NONNULL_END
