//
//  imageCell.m
//  UICollerctionViewHorizontal
//
//  Created by MAC on 2018/11/8.
//  Copyright © 2018年 MAC. All rights reserved.
//

#import "imageCell.h"
// 屏幕比例
#define SCREEN_RATE       ([UIScreen mainScreen].bounds.size.width/375.0)

@interface imageCell()
@property (nonatomic, strong) UIImageView *itemIcon;
//@property (nonatomic, strong) UIView *itemView;
@property (nonatomic, strong) UILabel *title;
@end

@implementation imageCell

@synthesize itemModel = _itemModel;

- (instancetype)initWithFrame:(CGRect)frame{
    if (self = [super initWithFrame:frame]) {
        self.contentView.backgroundColor = [UIColor clearColor];
        [self initView];
    }
    return self;
}

- (void)initView{
  CGFloat iconWidth = 100 * SCREEN_RATE;
  CGFloat iconHeight = 100 * SCREEN_RATE;
  UIView *itemView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, iconWidth, iconHeight)];
  [self.contentView addSubview:itemView];
  itemView.center = self.contentView.center;
//  itemView.backgroundColor = [UIColor redColor];

  _itemIcon = [[UIImageView alloc] init];
  [itemView addSubview:_itemIcon];
  _itemIcon.backgroundColor = [UIColor clearColor];
  _itemIcon.frame = CGRectMake(30, (iconHeight-20)/2, 20, 20);

  _title = [[UILabel alloc] initWithFrame:CGRectMake(50, 0, iconWidth-40, iconHeight)];
  [itemView addSubview:_title];
}

- (CollModel *)itemModel{
    return _itemModel;
}

- (void)setItemModel:(CollModel *)itemModel
{
    if (!itemModel) {
        return;
    }
    _itemModel = itemModel;
    
    [self setCellWithModel:_itemModel];
}

- (void)setCellWithModel:(CollModel *)itemModel{
    [[NSOperationQueue mainQueue] addOperationWithBlock:^{
      _itemIcon.image = [UIImage imageNamed:itemModel.url];
      _title.text = itemModel.title;
    }];
}






@end
