//
//  NSString+Category.m
//  scanning
//
//  Created by zwkj on 2019/7/1.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "NSString+Category.h"

@implementation NSString (Category)

/**
 * 验证英文
 */
- (BOOL)validateEng
{
  NSString *regex = @"[a-zA-Z]";
  NSPredicate *pred = [NSPredicate predicateWithFormat:@"SELF MATCHES %@",regex];
  if (![pred evaluateWithObject:self]) {
    return NO;
  }
  return YES;
}

/**
 * 验证中英文
 */
- (BOOL)validateChineseEng
{
  NSString *regex = @"^[a-zA-Z\u4e00-\u9fa5]*$";// @"[a-zA-Z\u4e00-\u9fa5][a-zA-Z\u4e00-\u9fa5]+";
  NSPredicate *pred = [NSPredicate predicateWithFormat:@"SELF MATCHES %@",regex];
  if (![pred evaluateWithObject:self]) {
    return NO;
  }
  return YES;
}

/**
 * 验证身份证号
 */
- (BOOL)validateIdCard
{
  NSString *regex = @"^([0-9]{0,17})([0-9]|[X]{0,1})$";
  NSPredicate *pred = [NSPredicate predicateWithFormat:@"SELF MATCHES %@",regex];
  if (![pred evaluateWithObject:self]) {
    return NO;
  }
  return YES;
}

- (NSString *)subBytesOfstringToIndex:(NSInteger)index
{
  return [self substringToIndex:index];
}

/**
 * 验证输入的是否为字母或数字
 */
- (BOOL)validateEngNumber
{
  NSString *regex = @"^[0-9a-zA-Z]*$";
  NSPredicate *pred = [NSPredicate predicateWithFormat:@"SELF MATCHES %@",regex];
  if (![pred evaluateWithObject:self]) {
    return NO;
  }
  return YES;
}

/**
 * 验证输入的是否为汉字、字母或数字
 */
- (BOOL)validateChineseEngNumber
{
  NSString *regex = @"^[0-9a-zA-Z\u4e00-\u9fa5]*$";
  NSPredicate *pred = [NSPredicate predicateWithFormat:@"SELF MATCHES %@",regex];
  if (![pred evaluateWithObject:self]) {
    return NO;
  }
  return YES;
}

/**
 * 根据值返回性别
 */
-(NSString *)renturnGender
{
  if ([self isEqualToString:@"1"]) {
    return @"男";
  } else {
    return @"女";
  }
}

/**
 * 根据性别返回值
 */
-(NSString *)renturnGenderValue
{
  if ([self isEqualToString:@"男"]) {
    return @"1";
  } else {
    return @"2";
  }
}

@end
