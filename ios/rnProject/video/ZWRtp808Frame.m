//
//  ZWRtp808Frame.m
//  rnProject
//
//  Created by zwkj on 2020/12/7.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import "ZWRtp808Frame.h"

@implementation ZWRtp808Frame
+(NSData*)encodeMessage:(NSString*)msg
{
  NSMutableData *data = [NSMutableData dataWithLength:msg.length];
  return data;
}
@end
