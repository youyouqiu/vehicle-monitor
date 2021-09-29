//
//  OCRPractitionersViewController.m
//  scanning
//
//  Created by zwkj on 2019/6/26.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "OCRPractitionersViewController.h"
#import "DTScrollStatusView.h"
#import "OCRCameraViewController.h"
#import "AppDelegate.h"
#import "OCRServices.h"
#import "OCRSingleton.h"
#import "NSString+Category.h"
#import "PhotoFullScreen.h"
#import "MyUITapGestureRecognizer.h"

#define SCREEN_WIDTH  [UIScreen mainScreen].bounds.size.width
#define SCREEN_HEIGHT [UIScreen mainScreen].bounds.size.height
#define SCREEN_RATE   ([UIScreen mainScreen].bounds.size.width/375.0)
static NSString * const imageC = @"imageCell";
static NSString * const moreImageC = @"imageCell";
static float imageHeight = 80;//cell 高度
#import "CollModel.h"
#import "imageCell.h"
#import "LHHorizontalPageFlowlayout.h"
#import "DTScrollStatusHeader.h"
#import <AVFoundation/AVFoundation.h>
#import "ToastView.h"

#define UIColorFromRGB(rgbValue) [UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 green:((float)((rgbValue & 0xFF00) >> 8))/255.0 blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

@interface OCRPractitionersViewController ()<DTScrollStatusDelegate, UICollectionViewDataSource, UICollectionViewDelegate>

@property (nonatomic, strong) UILabel *monitorNameLabel; // 监控对象名称
@property (nonatomic, strong) UILabel *peopleNameLabel; // 从业人员名称
@property (nonatomic, strong) UIButton *addButton; // 新增按钮
@property (nonatomic, strong) NSArray *idCardData;
@property (nonatomic, strong) NSArray *driverLicenseData;
@property (nonatomic, strong) NSArray *qualificationCertificateData;
@property (nonatomic, strong) UIButton *uploadPositive; // 上传证件正本按钮
@property (nonatomic, strong) UIButton *uploadReverse; // 上传证件正本按钮
@property (nonatomic, strong) UITableView *idCardTableView;
@property (nonatomic, strong) UITableView *driverLicenseTableView;
@property (nonatomic, strong) UITableView *qualificationCertificateTableView;
@property (nonatomic, strong) NSMutableArray *practitioners;


@property (nonatomic, strong) UICollectionView * collectionView;
@property (nonatomic, strong) NSMutableArray * modelArray;
@property (nonatomic, strong) UICollectionView * moreCollectionView;
@property (nonatomic, strong) UIView *layer;

/* 选择从业⼈人员中间⻚页相关变量量 */
@property (nonatomic, strong) UIView *schematicView;
@property (nonatomic, strong) UIButton *uploadCertificate;
@property (nonatomic, strong) UIImageView *schematicImageView;
@property (nonatomic, assign) NSString *hasPractitioners;

@property (nonatomic, strong) UIView *headerView;
@property (nonatomic, strong) UILabel *headerTitle;
//@property (nonatomic, strong) UINavigationController *nc;
@property (nonatomic, strong) UIImageView *idCardImageView;
@property (nonatomic, strong) UIImageView *driverLicenseImageView;
@property (nonatomic, strong) UIImageView *qualificationCertificateImageView;

@property (nonatomic, assign) NSString *selectionName;

@end

@implementation OCRPractitionersViewController

- (void)viewWillAppear:(BOOL)animated {
//  if ([self.navigationController respondsToSelector:@selector(interactivePopGestureRecognizer)]) {
//    self.navigationController.interactivePopGestureRecognizer.enabled = NO;
//  }
//  [super.navigationController setNavigationBarHidden:NO animated:YES];
//  self.view.backgroundColor = [UIColor whiteColor];
  [super viewWillAppear:animated];

  if ([self.navigationController respondsToSelector:@selector(interactivePopGestureRecognizer)]) {
    self.navigationController.interactivePopGestureRecognizer.enabled = NO;
  }
  self.navigationController.navigationBar.topItem.title = @"";
  self.navigationController.navigationBar.barTintColor = UIColorFromRGB(0x339eff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:1 alpha:1];
  [self.navigationController.navigationBar setTitleTextAttributes:
   @{NSFontAttributeName:[UIFont systemFontOfSize:18],
     NSForegroundColorAttributeName:[UIColor whiteColor]}];
  [[UINavigationBar appearance] setTintColor:[UIColor whiteColor]];
//  [super.navigationController setNavigationBarHidden:NO animated:YES];
  self.navigationController.navigationBarHidden = NO;
  self.view.backgroundColor = [UIColor whiteColor];
//  [OCRSingleton sharedSingleton].isNativePage = YES;
  self.title = @"从业人员信息";
  
  self.headerTitle = [[UILabel alloc] initWithFrame:CGRectMake(self.view.frame.size.width/2 - 75, 0, 150, self.navigationController.navigationBar.frame.size.height)];
  self.headerTitle.textAlignment = NSTextAlignmentCenter;
  self.headerTitle.textColor = [UIColor whiteColor];
  self.headerTitle.text = @"从业人员信息";
  [self.navigationController.navigationBar addSubview:self.headerTitle];
  
  if ([OCRSingleton sharedSingleton].isLoadData) {
    [self initData];
    [OCRSingleton sharedSingleton].isLoadData = NO;
  }
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];
  [self.headerTitle removeFromSuperview];
  self.headerTitle = nil;
  
  if(self.schematicView != nil){
    self.schematicView.hidden = YES;
    if(self.hasPractitioners == nil){
     self.layer.hidden = NO;
    }
  }
}

- (void)viewDidLoad {
  [super viewDidLoad];
  [OCRSingleton sharedSingleton].isLoadData = YES;
//  self.nc = self.navigationController;
  [self defaultData];
  [self initPage];
  [self setPageContent];
//  [self addCollectionView];
}

// 实现图文混排的方法
- (NSAttributedString *) creatAttrStringWithText:(NSString *) text image:(UIImage *) image{
  
  // NSTextAttachment可以将图片转换为富文本内容
  NSTextAttachment *attachment = [[NSTextAttachment alloc] init];
  attachment.bounds = CGRectMake(0, 0, 15, 15);
  attachment.image = image;
  // 通过NSTextAttachment创建富文本
  // 图片的富文本
  NSAttributedString *imageAttr = [NSAttributedString attributedStringWithAttachment:attachment];
  NSMutableAttributedString *mutableImageAttr = [[NSMutableAttributedString alloc] initWithAttributedString:imageAttr];
  [mutableImageAttr addAttribute:NSFontAttributeName value:[UIFont systemFontOfSize:15] range:NSMakeRange(0, imageAttr.length)];
  // 调整图片的位置，负数代表向下
  [mutableImageAttr addAttribute:NSBaselineOffsetAttributeName value:@(-2) range:NSMakeRange(0, imageAttr.length)];
  
  // 文字的富文本
  NSAttributedString *textAttr = [[NSMutableAttributedString alloc] initWithString:text attributes:@{NSFontAttributeName:[UIFont systemFontOfSize:15]}];
  
  // 空格富文本
  NSAttributedString *space = [[NSMutableAttributedString alloc] initWithString:@" " attributes:@{NSFontAttributeName:[UIFont systemFontOfSize:15]}];
  
  NSMutableAttributedString *mutableAttr = [[NSMutableAttributedString alloc] init];
  
  // 将图片、文字拼接
  // 如果要求图片在文字的后面只需要交换下面两句的顺序
  [mutableAttr appendAttributedString:textAttr];
  [mutableAttr appendAttributedString:space];
  [mutableAttr appendAttributedString:mutableImageAttr];
  return [mutableAttr copy];
}

- (void)initPage
{
  CGFloat height = self.view.bounds.size.height;
  CGFloat width = self.view.bounds.size.width;
  self.headerView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, width, 45)];
  self.headerView.backgroundColor = UIColorFromRGB(0xf4f7fa); // [UIColor whiteColor];
//  [_headerView bringSubviewToFront:];
  [self.view addSubview:self.headerView];
  // 顶部监控对象名称
  self.monitorNameLabel = [[UILabel alloc] initWithFrame:CGRectMake(15, 0, (width - 30) / 3, 45)];
  self.monitorNameLabel.textAlignment = NSTextAlignmentLeft;
  self.monitorNameLabel.textColor = UIColorFromRGB(0x7a869a);
  [self.headerView addSubview:self.monitorNameLabel];
//  self.monitorNameLabel.backgroundColor = [UIColor redColor];
  // 从业人员
  self.peopleNameLabel = [[UILabel alloc] initWithFrame:CGRectMake((width - 30) / 3 + 15, 0, (width - 30) / 3, 45)];
  self.peopleNameLabel.textAlignment = NSTextAlignmentCenter;
  self.peopleNameLabel.font = [UIFont fontWithName:@"Helvetica-Bold" size:17];
  [self.headerView addSubview:self.peopleNameLabel];
  self.peopleNameLabel.userInteractionEnabled = YES;
  UITapGestureRecognizer *labelTapGestureRecognizer = [[UITapGestureRecognizer alloc]initWithTarget:self action:@selector(labelTouchUpInside:)];
  
  [self.peopleNameLabel addGestureRecognizer:labelTapGestureRecognizer];
//  UIImage *image = [UIImage imageNamed:@"spinner.png"];
//  self.peopleNameLabel.attributedText = [self creatAttrStringWithText:@"--" image:image];
//  self.peopleNameLabel.backgroundColor = [UIColor blackColor];
  // 新增按钮
  UIImageView *addBtnIcon = [[UIImageView alloc] initWithFrame:CGRectMake(width - 45, 12, 21, 21)];
  UIImage *icon = [UIImage imageNamed:@"addPeopleIcon-1.png"];
  addBtnIcon.image = icon;
  addBtnIcon.contentMode = UIViewContentModeScaleAspectFit;
  [self.headerView addSubview:addBtnIcon];
  
  self.addButton = [[UIButton alloc] initWithFrame:CGRectMake((width - 30) / 3 * 2 + 15, 0, (width - 30) / 3, 45)];
  self.addButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentRight;
  [self.headerView addSubview:self.addButton];
  [self.addButton addTarget:self action:@selector(addBtnEvent:) forControlEvents:UIControlEventTouchUpInside];
//  [self.addButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
//  self.addButton.titleLabel.textColor = [UIColor blackColor];
//  self.addButton.backgroundColor = [UIColor grayColor];
  
  // 选项卡
  UIView *tabContentView = [[UIView alloc] initWithFrame:CGRectMake(0, 45, width, height - 45)];
  [self.view addSubview:tabContentView];
  tabContentView.backgroundColor = UIColorFromRGB(0xf4f7fa);
  
  DTScrollStatusView *scrollTapView = [[DTScrollStatusView alloc]initWithTitleArr:@[@"身份证", @"驾驶证", @"从业资格证"]
                                                                             type:ScrollTapTypeWithNavigation];
  scrollTapView.scrollStatusDelegate = self;
  scrollTapView.backgroundColor = [UIColor whiteColor];
  [tabContentView addSubview:scrollTapView];
}

/**
 * 从业人员下拉列表点击事件
 */
-(void)labelTouchUpInside:(UITapGestureRecognizer *)recognizer{
//  UILabel *label=(UILabel*)recognizer.view;
  if (self.practitioners.count > 0) {
    UIImage *image;
    if (self.collectionView.hidden) {
      image = [UIImage imageNamed:@"up.png"];
    } else {
      image = [UIImage imageNamed:@"xiala-3.png"];
    }
    self.peopleNameLabel.attributedText = [self creatAttrStringWithText:self.selectionName image:image];
    self.peopleNameLabel.font = [UIFont fontWithName:@"Helvetica-Bold" size:17];
    [self viewAnimation:self.collectionView willHidden:!self.collectionView.hidden];
  }
}

/**
 * 显示从业人员列表
 */
-(void)addCollectionView
{
//  NSArray *appArray = [[self getDict] objectForKey:@"dictInfo"];
  [self.modelArray removeAllObjects];
  for (int i = 0; i < self.practitioners.count; i++) {
    NSDictionary * appDic = self.practitioners[i];
    CollModel * model = [[CollModel alloc]init];
    model.title = [appDic objectForKey:@"title"];
    model.url = [appDic objectForKey:@"url"];
    model.vid = [appDic objectForKey:@"id"];
    [self.modelArray addObject:model];
  }
//  if (self.collectionView == nil) {
  [self createCollectionView];
//  }
}

-(void)setPageContent
{
  self.monitorNameLabel.text = [OCRSingleton sharedSingleton].monitorName;
  self.peopleNameLabel.text = @"--";
//  [self.addButton setTitle:@"新增" forState:UIControlStateNormal];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  
  static NSString *text = @"UITableViewCell";
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:text];
  if (cell == nil) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleValue1 reuseIdentifier:text];
  }
  if (tableView.tag == 0) {
    cell = [self idCardContent:cell indexPathRow:indexPath.row];
  }
  else if(tableView.tag == 1)
  {
    cell = [self driverLicenseContent:cell indexPathRow:indexPath.row];
  }
  else if (tableView.tag == 2) {
    cell = [self qualificationCertificateContent:cell indexPathRow: indexPath.row];
  }
  cell.selectionStyle = UITableViewCellSelectionStyleNone;
  return cell;
}

/**
 * 身份证正面
 */
-(UITableViewCell *)idCardContent:(UITableViewCell *)cell indexPathRow:(NSInteger)index
{
  if (index == 0) {
    NSDictionary *data = [self.idCardData objectAtIndex:index];
    UIImage *image = [data objectForKey:@"value"];
    // UIImage *image = [UIImage imageNamed:value];
    if (self.idCardImageView == nil) {
      self.idCardImageView = [[UIImageView alloc] initWithFrame:CGRectMake(40, 15, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
      self.idCardImageView.contentMode = UIViewContentModeScaleAspectFit;
//      self.idCardImageView.backgroundColor = [UIColor whiteColor]; // UIColorFromRGB(0xf4f7fa);
//      self.idCardImageView.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
//      self.idCardImageView.layer.borderWidth = 1.0f;
      self.idCardImageView.userInteractionEnabled = YES;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.idCardImageView addGestureRecognizer:singleTap];
      [cell.contentView addSubview:self.idCardImageView];
      self.idCardImageView.image = image;
    }
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (index == 4) {
    self.uploadPositive = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadPositive setTitle:@"上传证件" forState:UIControlStateNormal];
    self.uploadPositive.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadPositive.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:1 alpha:1];
    [self.uploadPositive addTarget:self action:@selector(uploadIdCardEvent) forControlEvents:UIControlEventTouchUpInside];
    [cell addSubview:self.uploadPositive];
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    self.uploadPositive.layer.cornerRadius = 5;
  } else {
    NSDictionary *data = [self.idCardData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.detailTextLabel.text = value;
    cell.textLabel.text = key;
  }
  return cell;
}

/**
 * 身份证正面上传
 */
- (void)uploadIdCardEvent
{
  if ([self cameraPermissionsValidation]) {
    if (self.idCardData.count >= 6) {
      [OCRSingleton sharedSingleton].isAddPractitioners = NO;
      NSDictionary *data = self.idCardData[5];
      if (data != nil) {
        NSString *oldPhotoUrl = [data objectForKey:@"value"];
        [OCRSingleton sharedSingleton].oldPhotoUrl = oldPhotoUrl;
        [OCRSingleton sharedSingleton].tableSelectedIndex = 0;;
        AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        OCRCameraViewController *cv = [[OCRCameraViewController alloc] init];
        cv.type = 11;
        [app.nav pushViewController:cv animated:YES];
      }
    }
  }
}

/**
 * 驾驶证正面
 */
-(UITableViewCell *)driverLicenseContent:(UITableViewCell *)cell indexPathRow:(NSInteger)index
{
  if (index == 0) {
    NSDictionary *data = [self.driverLicenseData objectAtIndex:index];
    UIImage *image = [data objectForKey:@"value"];
//    UIImage *image = [UIImage imageNamed:value];
    if (self.driverLicenseImageView == nil) {
      self.driverLicenseImageView = [[UIImageView alloc] initWithFrame:CGRectMake(40, 15, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
      self.driverLicenseImageView.contentMode = UIViewContentModeScaleAspectFit;
//      self.driverLicenseImageView.backgroundColor = [UIColor whiteColor]; // UIColorFromRGB(0xf4f7fa);
//      self.driverLicenseImageView.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
//      self.driverLicenseImageView.layer.borderWidth = 1.0f;
      
      self.driverLicenseImageView.userInteractionEnabled = YES;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.driverLicenseImageView addGestureRecognizer:singleTap];
      [cell.contentView addSubview:self.driverLicenseImageView];
      self.driverLicenseImageView.image = image;
    }
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (index == 5) {
    self.uploadReverse = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadReverse setTitle:@"上传证件" forState:UIControlStateNormal];
    self.uploadReverse.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadReverse.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:1 alpha:1];
    [self.uploadReverse addTarget:self action:@selector(uploadDriverLicenseEvent) forControlEvents:UIControlEventTouchUpInside];
    [cell addSubview:self.uploadReverse];
    self.uploadReverse.layer.cornerRadius = 5;
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else {
    NSDictionary *data = [self.driverLicenseData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.detailTextLabel.text = value;
    cell.textLabel.text = key;
  }
  return cell;
}

/**
 * 驾驶证上传
 */
- (void)uploadDriverLicenseEvent
{
  if ([self cameraPermissionsValidation]) {
    if (self.driverLicenseData.count >= 6) {
      NSDictionary *data = self.driverLicenseData[5];
      NSString *oldPhotoUrl = [data objectForKey:@"value"];
      [OCRSingleton sharedSingleton].oldPhotoUrl = oldPhotoUrl;
      [OCRSingleton sharedSingleton].tableSelectedIndex = 1;
      AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      OCRCameraViewController *cv = [[OCRCameraViewController alloc] init];
      cv.type = 6;
      [app.nav pushViewController:cv animated:YES];
    }
  }
}


- (void)refreshViewWithTag:(NSInteger)tag
                  isHeader:(BOOL)isHeader {
  if(isHeader)
  {
    NSLog(@"当前%ld个tableview 的头部正在刷新", (long)tag);
  }
  else
  {
    NSLog(@"当前%ld个tableview 的尾部正在刷新", (long)tag);
  }
}

-(UITableViewCell *)qualificationCertificateContent:(UITableViewCell *)cell indexPathRow:(NSInteger)index
{
  if (index == 0) {
    NSDictionary *data = [self.qualificationCertificateData objectAtIndex:index];
    UIImage *image = [data objectForKey:@"value"];
//    UIImage *image = [UIImage imageNamed:value];
    if (self.qualificationCertificateImageView == nil) {
      self.qualificationCertificateImageView = [[UIImageView alloc] initWithFrame:CGRectMake(40, 15, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
      self.qualificationCertificateImageView.contentMode = UIViewContentModeScaleAspectFit;
//      self.qualificationCertificateImageView.backgroundColor = [UIColor whiteColor];
//      self.qualificationCertificateImageView.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
//      self.qualificationCertificateImageView.layer.borderWidth = 1.0f;
      
      self.qualificationCertificateImageView.userInteractionEnabled = YES;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.qualificationCertificateImageView addGestureRecognizer:singleTap];
      [cell.contentView addSubview:self.qualificationCertificateImageView];
      self.qualificationCertificateImageView.image = image;
    }
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (index == 2) {
    self.uploadReverse = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadReverse setTitle:@"上传证件" forState:UIControlStateNormal];
    self.uploadReverse.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadReverse.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:1 alpha:1];
    [self.uploadReverse addTarget:self action:@selector(uploadQualificationCertificateEvent) forControlEvents:UIControlEventTouchUpInside];
    [cell addSubview:self.uploadReverse];
    self.uploadReverse.layer.cornerRadius = 5;
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else {
    NSDictionary *data = [self.qualificationCertificateData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.detailTextLabel.text = value;
    cell.textLabel.text = key;
  }
  return cell;
}

- (void)uploadQualificationCertificateEvent
{
  if ([self cameraPermissionsValidation]) {
    if (self.qualificationCertificateData.count >= 3) {
      NSDictionary *data = self.qualificationCertificateData[2];
      NSString *oldPhotoUrl = [data objectForKey:@"value"];
      [OCRSingleton sharedSingleton].oldPhotoUrl = oldPhotoUrl;
      [OCRSingleton sharedSingleton].tableSelectedIndex = 2;
      AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      OCRCameraViewController *cv = [[OCRCameraViewController alloc] init];
      cv.type = 5;
      [app.nav pushViewController:cv animated:YES];
    }
  }
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
  return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  if (tableView.tag == 0) {
    self.idCardTableView = tableView;
    return 5;
  }
  else if (tableView.tag == 1) {
    self.driverLicenseTableView = tableView;
    return 6;
  } else {
    self.qualificationCertificateTableView = tableView;
    return 3;
  }
}

/**
 * 行驶证正面数据填充
 */
-(void)setContentValue
{
  
}

- (void)defaultData
{
  UIImage *idCardPhoto = [UIImage imageNamed:@"idCardPhoto.png"];
  UIImage *driverPhoto = [UIImage imageNamed:@"driverPhoto.png"];
  UIImage *qualificationCertificatePhoto = [UIImage imageNamed:@"qualificationCertificatePhoto.png"];
  // 身份证正面数据
  self.idCardData = @[
                      @{@"key": @"图片", @"value": idCardPhoto},
                      @{@"key": @"姓名", @"value": @"--"},
                      @{@"key": @"性别", @"value": @"--"},
                      @{@"key": @"身份证号", @"value": @"--"},
//                      @{@"key": @"电话号码", @"value": @"--"}
                    ];
  // 驾驶证数据
  self.driverLicenseData = @[
                             @{@"key": @"图片", @"value": driverPhoto},
                             @{@"key": @"驾驶证号", @"value": @"--"},
                             @{@"key": @"准驾车型", @"value": @"--"},
                             @{@"key": @"有效期起", @"value": @"--"},
                             @{@"key": @"有效期至", @"value": @"--"}
                           ];
  // 从业资格证书数据
  self.qualificationCertificateData = @[
                                        @{@"key": @"图片", @"value": qualificationCertificatePhoto},
                                        @{@"key": @"从业资格证", @"value": @"--"},
                                        @{@"key": @"oldPhotoUrl", @"value": @""}
                                      ];
}

-(void)initData
{
  NSDictionary *params = @{
                           @"id": [OCRSingleton sharedSingleton].monitorId!=nil?[OCRSingleton sharedSingleton].monitorId:@"",
                           };
  [[OCRServices shardService] requestPractitionersList:params
                                        successHandler:^(id result) {
                                          [self practitionersListHandler:result];
                                        }
                                           failHandler:^(NSError *err) {
                                             if (err.code == 50050) {
                                               dispatch_async(dispatch_get_main_queue(), ^{
                                                 [[ToastView shareInstance] makeToast:@"登录失效，请重新登录" duration:2.0];
                                                 dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                                                   NSArray *controllers = self.navigationController.viewControllers;
                                                   self.navigationController.navigationBarHidden = YES;
                                                   [self.navigationController popToViewController:[controllers objectAtIndex:controllers.count - 2] animated:YES];
                                                 });
                                               });
                                             }
                                           }];
}

/**
 * 从业人员列表获取成功处理
 */
-(void)practitionersListHandler:(id)result
{
  NSInteger statusCode = [[result objectForKey:@"statusCode"] integerValue];
  BOOL success = [[result objectForKey:@"success"] boolValue];
  if (statusCode == 200 && success == YES) {
    NSArray *data = [result objectForKey:@"obj"];
    
    if (![data isEqual:[NSNull null]]) {
      NSLog(@"数据 %@",data);
      if (data.count && data.count > 0) {
        self.hasPractitioners = @"has";
        NSString *firstId = nil;
        NSString *firstName = nil;
        self.practitioners = [[NSMutableArray alloc] init];
        if(data.count){
          for (int i = 0; i < data.count; i++) {
            NSDictionary *info = data[i];
            NSString *name = [info objectForKey:@"name"];
            NSString *vid = [info objectForKey:@"id"];
            NSDictionary *dic = @{
                                  @"title": name!=nil?name:@"",
                                    @"id": vid!=nil?vid:@"",
                                    @"url": @"renyuan-2.png",
                                    };
              //        [self.practitioners setObject:id forKey:name];
            [self.practitioners addObject:dic];
            if (i == 0) {
              firstId = vid;
              firstName = ![name isEqual:[NSNull null]] ? name :  @"";
            }
          }
        }
        
        dispatch_async(dispatch_get_main_queue(), ^{
          if (self.layer != nil) {
            self.layer.hidden = YES;
          }
          if(self.schematicView != nil){
            self.schematicView.hidden = YES;
          }
          [OCRSingleton sharedSingleton].peopleName = firstName;
          if (data.count && data.count > 1) {
            [self addCollectionView];
            UIImage *image = [UIImage imageNamed:@"xiala-3.png"];
            self.selectionName = firstName;
            self.peopleNameLabel.attributedText = [self creatAttrStringWithText:firstName image:image];
            self.peopleNameLabel.font = [UIFont fontWithName:@"Helvetica-Bold" size:17];
          } else {
            self.peopleNameLabel.text = firstName;
            self.peopleNameLabel.font = [UIFont fontWithName:@"Helvetica-Bold" size:17];
          }
          
          [self initSchematicView];
        });
        if (firstId != nil) {
          [self searchPractitionersInfo:firstId];
        }
      } else {
        dispatch_async(dispatch_get_main_queue(), ^{
          if (self.layer == nil) {
            CGFloat height = self.view.bounds.size.height;
            CGFloat width = self.view.bounds.size.width;
            self.layer = [[UIView alloc] initWithFrame:CGRectMake(0, 45, width, height - 100)];
            [self.view addSubview:self.layer];
            self.layer.backgroundColor = UIColorFromRGB(0xf4f7fa); // [UIColor whiteColor];
            
            UIImageView *imageView = [[UIImageView alloc] initWithFrame:CGRectMake(0, (height - 100) / 2 - 100, width, 100)];
            UIImage *image = [UIImage imageNamed:@"renyuan.png"];
            imageView.image = image;
            imageView.contentMode = UIViewContentModeScaleAspectFit;
            [self.layer addSubview:imageView];
            
            UILabel *title = [[UILabel alloc] initWithFrame:CGRectMake(0, (height - 100) / 2, width, 30)];
            [self.layer addSubview:title];
            title.textAlignment = NSTextAlignmentCenter;
            title.textColor = [UIColor grayColor];
            [title setText:@"该监控对象尚未关联从业人员"];
          } else {
            self.layer.hidden = NO;
          }
          
          [self initSchematicView];
        });
      }
    } else {
      dispatch_async(dispatch_get_main_queue(), ^{
        if (self.layer == nil) {
          CGFloat height = self.view.bounds.size.height;
          CGFloat width = self.view.bounds.size.width;
          self.layer = [[UIView alloc] initWithFrame:CGRectMake(0, 45, width, height - 100)];
          [self.view addSubview:self.layer];
          self.layer.backgroundColor = [UIColor whiteColor];
          
          UIImageView *imageView = [[UIImageView alloc] initWithFrame:CGRectMake(0, (height - 100) / 2 - 100, width, 100)];
          UIImage *image = [UIImage imageNamed:@"renyuan.png"];
          imageView.image = image;
          imageView.contentMode = UIViewContentModeScaleAspectFit;
          [self.layer addSubview:imageView];
          
          UILabel *title = [[UILabel alloc] initWithFrame:CGRectMake(0, (height - 100) / 2, width, 30)];
          [self.layer addSubview:title];
          title.textAlignment = NSTextAlignmentCenter;
          [title setText:@"该监控对象尚未关联从业人员"];
        } else {
          self.layer.hidden = NO;
        }
        
        [self initSchematicView];
      });
    }
  }
}

/**
 * 初始化相册选择中间页
 */
-(void)initSchematicView
{
  if (self.schematicView == nil) {
    CGFloat height = self.view.bounds.size.height;
    CGFloat width = self.view.bounds.size.width;
    self.schematicView = [[UIView alloc] initWithFrame:CGRectMake(0, 45, width, height - 130)];
    [self.view addSubview:self.schematicView];
    self.schematicView.backgroundColor = [UIColor whiteColor];
    self.schematicImageView = [[UIImageView alloc] initWithFrame:CGRectMake(40, 30, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
    self.schematicImageView.contentMode = UIViewContentModeScaleAspectFit;
    self.schematicImageView.userInteractionEnabled = YES;
    [self.schematicView addSubview:self.schematicImageView];
    UIImage *image = [UIImage imageNamed:@"idCardPhoto.png"];
    self.schematicImageView.image = image;
    MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
    singleTap.image = image;
    [self.schematicImageView addGestureRecognizer:singleTap];
    self.uploadCertificate = [[UIButton alloc] initWithFrame:CGRectMake(15, 220, self.view.frame.size.width - 30, 40)];
    [self.uploadCertificate setTitle:@"上传证件" forState:UIControlStateNormal]; self.uploadCertificate.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter; self.uploadCertificate.backgroundColor = UIColorFromRGB(0x4287ff);
    [self.uploadCertificate addTarget:self action:@selector(uploadBtnEvent:) forControlEvents:UIControlEventTouchUpInside]; [self.schematicView addSubview:self.uploadCertificate];
    self.uploadCertificate.layer.cornerRadius = 5;
    self.schematicView.hidden = YES;
  } else {
    self.schematicView.hidden = YES;
  }
}

/**
 * 查询从业人员信息
 */
-(void)searchPractitionersInfo:(NSString *)practitionersId
{
  [OCRSingleton sharedSingleton].practitionersId = practitionersId;
  if(practitionersId != nil){
  NSDictionary *params = @{
                           @"id": practitionersId,
                           };
  [[OCRServices shardService] requestPractitionersInfo:params
                                        successHandler:^(id result) {
                                          [self practitionersInfoHandler:result];
                                        }
                                           failHandler:^(NSError *err) {
                                             if (err.code == 50050) {
                                               dispatch_async(dispatch_get_main_queue(), ^{
                                                 [[ToastView shareInstance] makeToast:@"登录失效，请重新登录" duration:2.0];
                                                 dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                                                   NSArray *controllers = self.navigationController.viewControllers;
                                                   self.navigationController.navigationBarHidden = YES;
                                                   [self.navigationController popToViewController:[controllers objectAtIndex:controllers.count - 2] animated:YES];
                                                 });
                                               });
                                             }
                                           }];
  }
}

/**
 * 处理查询从业人员成功后的信息
 */
-(void)practitionersInfoHandler:(id)result
{
  NSInteger statusCode = [[result objectForKey:@"statusCode"] integerValue];
  BOOL success = [[result objectForKey:@"success"] boolValue];
  if (statusCode == 200 && success == YES) {
    NSDictionary *data = [result objectForKey:@"obj"];
    if ([data isEqual:[NSNull null]]) {
      data = [[NSDictionary alloc] init];
    }
    NSString *identityCardPhoto = [data objectForKey:@"identityCardPhoto"];
    UIImage *idCardImage = nil;
    NSString *photoUrl = @"";
    if (![identityCardPhoto isEqual:[NSNull null]] && identityCardPhoto != nil) {
     photoUrl = [NSString stringWithFormat:@"%@%@", [OCRSingleton sharedSingleton].imageWebUrl, identityCardPhoto];
    } else {
      identityCardPhoto = @"";
    }
    NSOperationQueue *operationQueue = [[NSOperationQueue alloc] init];
    NSInvocationOperation *op = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(downloadIdCardImage:) object:photoUrl];
    [operationQueue addOperation:op];
    
    if (idCardImage == nil) {
      idCardImage = [UIImage imageNamed:@"idCardPhoto.png"];
      dispatch_async(dispatch_get_main_queue(), ^{
        self.idCardImageView.image = idCardImage;
      });
    }
    NSString *name = [data objectForKey:@"name"];
    if ([name isEqual:[NSNull null]] || name == nil) {
      name = @"--";
    }
    NSString *gender = [data objectForKey:@"gender"];
    if (gender == nil || [gender isEqual:[NSNull null]]) {
      gender = @"--";
    }else{
      gender = [gender renturnGender];
    }
    NSString *identity = [data objectForKey:@"identity"];
    if (identity == nil || [identity isEqual:[NSNull null]]) {
      identity = @"--";
    }
    NSString *phone = [data objectForKey:@"phone"];
    if (phone == nil || [phone isEqual:[NSNull null]]) {
      phone = @"--";
    }
    // 岗位类型
    NSString *positionType = [data objectForKey:@"positionType"];
    if (positionType!=nil && ![positionType isEqual:[NSNull null]]) {
      if ([positionType isEqualToString:@"ed057aa7-64b8-4ec1-9b14-dbc62b4286d4"]) {
        [OCRSingleton sharedSingleton].isICType = YES;
      } else {
        [OCRSingleton sharedSingleton].isICType = NO;
      }
    } else {
      [OCRSingleton sharedSingleton].isICType = NO;
    }
    
    self.idCardData = @[
                        @{@"key": @"图片", @"value": idCardImage},
                        @{@"key": @"姓名", @"value": name},
                        @{@"key": @"性别", @"value": gender},
                        @{@"key": @"身份证号", @"value": identity},
                        @{@"key": @"电话号码", @"value": phone},
                        @{@"key": @"oldPhotoUrl", @"value": identityCardPhoto}
                      ];
    
    
    
    NSString *driverLicensePhoto = [data objectForKey:@"driverLicensePhoto"];
    
    UIImage *driverLicenseImage = nil;
//    if (![driverLicensePhoto isEqual:[NSNull null]]) {
    NSString *driverLicensePhotoUrl = @"";
    if (![driverLicensePhoto isEqual:[NSNull null]] && driverLicensePhoto != nil) {
      driverLicensePhotoUrl = [NSString stringWithFormat:@"%@%@", [OCRSingleton sharedSingleton].imageWebUrl, driverLicensePhoto];
    } else {
      driverLicensePhoto = @"";
    }
      NSOperationQueue *driverOperationQueue = [[NSOperationQueue alloc] init];
      NSInvocationOperation *driverOp = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(downloadDriverLicenseImage:) object:driverLicensePhotoUrl];
      [driverOperationQueue addOperation:driverOp];
//    }
    
    if (driverLicenseImage == nil) {
      driverLicenseImage = [UIImage imageNamed:@"driverPhoto.png"];
      dispatch_async(dispatch_get_main_queue(), ^{
        self.driverLicenseImageView.image = driverLicenseImage;
      });
    }
    NSString *drivingLicenseNo = [data objectForKey:@"drivingLicenseNo"];
    if (drivingLicenseNo == nil || [drivingLicenseNo isEqual:[NSNull null]]) {
      drivingLicenseNo = @"--";
    }
    NSString *drivingType = [data objectForKey:@"drivingType"];
    if (drivingType == nil || [drivingType isEqual:[NSNull null]]) {
      drivingType = @"--";
    }
    NSString *drivingStartDate = [data objectForKey:@"drivingStartDate"];
    if (drivingStartDate == nil || [drivingStartDate isEqual:[NSNull null]]) {
      drivingStartDate = @"--";
    } else {
      NSArray *drivingStartDateArr = [drivingStartDate componentsSeparatedByString:@" "];
      drivingStartDate = drivingStartDateArr[0];
    }
    
    NSString *drivingEndDate = [data objectForKey:@"drivingEndDate"];
    if ([drivingEndDate isEqual:[NSNull null]] || drivingEndDate == nil) {
      drivingEndDate = @"--";
    } else {
      NSArray *drivingEndDateArr = [drivingEndDate componentsSeparatedByString:@" "];
      drivingEndDate = drivingEndDateArr[0];
    }
    
    self.driverLicenseData = @[
                               @{@"key": @"图片", @"value": driverLicenseImage},
                               @{@"key": @"驾驶证号", @"value": drivingLicenseNo},
                               @{@"key": @"准驾车型", @"value": drivingType},
                               @{@"key": @"有效期起", @"value": drivingStartDate},
                               @{@"key": @"有效期至", @"value": drivingEndDate},
                               @{@"key": @"oldPhotoUrl", @"value": driverLicensePhoto}
                             ];
    
    NSString *qualificationCertificatePhoto = [data objectForKey:@"qualificationCertificatePhoto"];
    UIImage *qualificationCertificateImage = nil;
//    if (![qualificationCertificatePhoto isEqual:[NSNull null]]) {
    NSString *qcPhotoUrl = @"";
    if (qualificationCertificatePhoto != nil && ![qualificationCertificatePhoto isEqual:[NSNull null]]) {
      qcPhotoUrl = [NSString stringWithFormat:@"%@%@", [OCRSingleton sharedSingleton].imageWebUrl, qualificationCertificatePhoto];
    } else {
      qualificationCertificatePhoto = @"";
    }
      NSOperationQueue *qcOperationQueue = [[NSOperationQueue alloc] init];
      NSInvocationOperation *qcOp = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(downloadQualificationCertificateImage:) object:qcPhotoUrl];
      [qcOperationQueue addOperation:qcOp];
//    }
    
    if (qualificationCertificateImage == nil) {
      qualificationCertificateImage = [UIImage imageNamed:@"qualificationCertificatePhoto.png"];
      dispatch_async(dispatch_get_main_queue(), ^{
        self.qualificationCertificateImageView.image = qualificationCertificateImage;
      });
    }
    NSString *cardNumber = [data objectForKey:@"cardNumber"];
    if (cardNumber == nil || [cardNumber isEqual:[NSNull null]]) {
      cardNumber = @"--";
    }
    self.qualificationCertificateData = @[
                                          @{@"key": @"图片", @"value": qualificationCertificateImage},
                                          @{@"key": @"从业资格证", @"value": cardNumber},
                                          @{@"key": @"oldPhotoUrl", @"value": qualificationCertificatePhoto}
                                        ];
    
    dispatch_async(dispatch_get_main_queue(), ^{
      [self.idCardTableView reloadData];
      [self.driverLicenseTableView reloadData];
      [self.qualificationCertificateTableView reloadData];
      if ([OCRSingleton sharedSingleton].isICType) {
        [OCRSingleton sharedSingleton].idCardData = self.idCardData;
        [OCRSingleton sharedSingleton].driverLicenseData = self.driverLicenseData;
        [OCRSingleton sharedSingleton].qualificationCertificateData = self.qualificationCertificateData;
      }
    });
  }
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.row == 0) {
    return (self.view.frame.size.width - 80) * 0.56 + 30;
  }
  return 44;
}


//- (NSDictionary *)getDict {
//  NSString * string  = @"{\"dictInfo\":[{\"title\":\"你好啊\",\"url\":\"1.jpeg\"},{\"title\":\"你好啊\",\"url\":\"2.jpeg\"},{\"title\":\"你好啊\",\"url\":\"3.jpeg\"},{\"title\":\"你好啊\",\"url\":\"4.jpeg\"},{\"title\":\"你好啊\",\"url\":\"5.jpeg\"},{\"title\":\"你好啊\",\"url\":\"6.jpeg\"},{\"title\":\"是很好\",\"url\":\"7.jpeg\"},{\"title\":\"你好啊\",\"url\":\"1.jpeg\"},{\"title\":\"你好啊\",\"url\":\"2.jpeg\"},{\"title\":\"你好啊\",\"url\":\"3.jpeg\"},{\"title\":\"你好啊\",\"url\":\"4.jpeg\"},{\"title\":\"你好啊\",\"url\":\"5.jpeg\"},{\"title\":\"你好啊\",\"url\":\"6.jpeg\"},{\"title\":\"是很好\",\"url\":\"7.jpeg\"},{\"title\":\"你好啊\",\"url\":\"1.jpeg\"},{\"title\":\"你好啊\",\"url\":\"2.jpeg\"},{\"title\":\"你好啊\",\"url\":\"3.jpeg\"},{\"title\":\"你好啊\",\"url\":\"4.jpeg\"},{\"title\":\"你好啊\",\"url\":\"5.jpeg\"},{\"title\":\"你好啊\",\"url\":\"6.jpeg\"},{\"title\":\"是很好\",\"url\":\"7.jpeg\"}]}";
//  NSDictionary *infoDic = [self dictionaryWithJsonString:string];
//  return infoDic;
//}


//-(NSDictionary *)dictionaryWithJsonString:(NSString *)jsonString {
//  if (jsonString == nil) {
//    return nil;
//  }
//  NSData *jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
//  NSError *err;
//  NSDictionary *dic = [NSJSONSerialization JSONObjectWithData:jsonData options:NSJSONReadingMutableContainers  error:&err];
//  if(err)
//  {
//    NSLog(@"json解析失败：%@",err);
//    return nil;
//  }
//  return dic;
//}

- (NSMutableArray *)modelArray {
  if (!_modelArray) {
    _modelArray = [NSMutableArray array];
  }
  return _modelArray;
}

- (void)createCollectionView{  
  UICollectionViewFlowLayout * layout = [[UICollectionViewFlowLayout alloc]init];
  layout.scrollDirection = UICollectionViewScrollDirectionHorizontal;
  layout.minimumLineSpacing = 0;
  layout.minimumInteritemSpacing = 0;
  if (_collectionView == nil) {
    _collectionView = [[UICollectionView alloc] initWithFrame:CGRectMake(0, 45, [UIScreen mainScreen].bounds.size.width, imageHeight * SCREEN_RATE / 2) collectionViewLayout:layout];
    _collectionView.tag = 11;
    _collectionView.backgroundColor = [UIColor whiteColor]; // [UIColor colorWithRed:186 / 255.0 green:186 / 255.0 blue:186 / 255.0 alpha:0.9];
    _collectionView.dataSource = self;
    _collectionView.delegate = self;
    _collectionView.bounces = NO;
    _collectionView.alwaysBounceHorizontal = YES;
    _collectionView.alwaysBounceVertical = NO;
    _collectionView.showsHorizontalScrollIndicator = NO;
    _collectionView.showsVerticalScrollIndicator = NO;
    [self.view addSubview:_collectionView];
    [_collectionView registerClass:[imageCell class] forCellWithReuseIdentifier:imageC];
  } else {
    [_collectionView reloadData];
  }
  _collectionView.hidden = YES;
  
  [self.view bringSubviewToFront:self.headerView];
}

- (NSInteger)collectionView:(UICollectionView *)collectionView numberOfItemsInSection:(NSInteger)section{
  return self.modelArray.count;
}

- (UICollectionViewCell *)collectionView:(UICollectionView *)collectionView cellForItemAtIndexPath:(NSIndexPath *)indexPath {
  CollModel * model = self.modelArray[indexPath.row];
  imageCell * cell = [collectionView dequeueReusableCellWithReuseIdentifier:imageC forIndexPath:indexPath];
  cell.itemModel = model;
  return cell;
}

// 返回每个item的大小
- (CGSize)collectionView:(UICollectionView *)collectionView layout:(UICollectionViewLayout *)collectionViewLayout sizeForItemAtIndexPath:(NSIndexPath *)indexPath {
  CGFloat CWidth =  imageHeight * SCREEN_RATE;
  CGFloat CHeight = imageHeight * SCREEN_RATE;
  return CGSizeMake(CWidth, CHeight);
}

#pragma mark - UICollectionViewDelegate点击事件
- (void)collectionView:(UICollectionView *)collectionView didSelectItemAtIndexPath:(NSIndexPath *)indexPath{
  CollModel * model = self.modelArray[indexPath.row];
  NSLog(@"self.appModelArray----%@",model.title);
  UIImage *image = [UIImage imageNamed:@"xiala-3.png"];
  self.selectionName = model.title;
  self.peopleNameLabel.attributedText = [self creatAttrStringWithText:model.title image:image];
  self.peopleNameLabel.font = [UIFont fontWithName:@"Helvetica-Bold" size:17];
  [self searchPractitionersInfo:model.vid];
  [self viewAnimation:self.collectionView willHidden:YES];
  [OCRSingleton sharedSingleton].peopleName = model.title;
}


- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
}

/**
 * 选择器显示与隐藏动画
 */
- (void)viewAnimation:(UIView*)view willHidden:(BOOL)hidden {
//  CGFloat height = self.view.frame.size.height;
  CGFloat width = self.view.frame.size.width;
  [UIView animateWithDuration:0.2
                   animations:^{
    if (hidden) {
      view.frame = CGRectMake(0, 0, width, imageHeight * SCREEN_RATE / 2);
    } else {
      [view setHidden:hidden];
      view.frame = CGRectMake(0, 45, width, imageHeight * SCREEN_RATE / 2);
    }
  } completion:^(BOOL finished) {
    [view setHidden:hidden];
  }];
}

-(void)addBtnEvent:(UIButton *)btn {
  if(self.schematicView != nil){
    if (self.schematicView.hidden == YES) {
      self.schematicView.hidden = NO;
      if (self.layer.hidden == NO) {
        self.layer.hidden = YES;
      }
    }
  }
}

-(void)uploadBtnEvent:(UIButton *)btn {
  if ([self cameraPermissionsValidation]) {
    [OCRSingleton sharedSingleton].isAddPractitioners = YES;
    [OCRSingleton sharedSingleton].tableSelectedIndex = 0;
    [OCRSingleton sharedSingleton].peopleName = @"";
    AppDelegate *app = (AppDelegate *)[[UIApplication sharedApplication] delegate]; OCRCameraViewController *cv = [[OCRCameraViewController alloc] init]; cv.type = 11;
    [app.nav pushViewController:cv animated:YES];
    if (self.schematicView.hidden == NO) {
      self.schematicView.hidden = YES;
    }
    if(self.hasPractitioners == nil){
      self.layer.hidden = NO;
    }
  }
}

- (void)handleSingleTap:(UITapGestureRecognizer *)gestureRecognizer {
  MyUITapGestureRecognizer *tap = (MyUITapGestureRecognizer *)gestureRecognizer;
  [[PhotoFullScreen shareInstances] makeToast:tap.image];
}

/**
 * 验证相机权限是否开启
 */
- (BOOL)cameraPermissionsValidation
{
  NSString *mediaType = AVMediaTypeVideo;//读取媒体类型
  AVAuthorizationStatus authStatus = [AVCaptureDevice authorizationStatusForMediaType:mediaType];//读取设备授权状态
  if(authStatus == AVAuthorizationStatusRestricted || authStatus == AVAuthorizationStatusDenied) {
    [[ToastView shareInstance] makeToast:@"相机权限已关闭，请在设置当中重新设置" duration:2.0];
    return NO;
  }
  return YES;
}

- (void)downloadIdCardImage:(NSString *)url
{
  NSURL *imageUrl = [NSURL URLWithString:url];
  UIImage *image = [UIImage imageWithData:[NSData dataWithContentsOfURL:imageUrl]];
  if (image != nil) {
    dispatch_async(dispatch_get_main_queue(), ^{
      self.idCardImageView.image = image;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.idCardImageView addGestureRecognizer:singleTap];
    });
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = [UIImage imageNamed:@"idCardPhoto.png"];
      [self.idCardImageView addGestureRecognizer:singleTap];
    });
  }
}

- (void)downloadDriverLicenseImage:(NSString *)url
{
  NSURL *imageUrl = [NSURL URLWithString:url];
  UIImage *image = [UIImage imageWithData:[NSData dataWithContentsOfURL:imageUrl]];
  if (image != nil) {
    dispatch_async(dispatch_get_main_queue(), ^{
      self.driverLicenseImageView.image = image;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.driverLicenseImageView addGestureRecognizer:singleTap];
    });
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = [UIImage imageNamed:@"driverPhoto.png"];
      [self.driverLicenseImageView addGestureRecognizer:singleTap];
    });
  }
}

- (void)downloadQualificationCertificateImage:(NSString *)url
{
  NSURL *imageUrl = [NSURL URLWithString:url];
  UIImage *image = [UIImage imageWithData:[NSData dataWithContentsOfURL:imageUrl]];
  if (image != nil) {
    dispatch_async(dispatch_get_main_queue(), ^{
      self.qualificationCertificateImageView.image = image;
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = image;
      [self.qualificationCertificateImageView addGestureRecognizer:singleTap];
    });
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
      singleTap.image = [UIImage imageNamed:@"qualificationCertificatePhoto.png"];
      [self.qualificationCertificateImageView addGestureRecognizer:singleTap];
    });
  }
}

@end
