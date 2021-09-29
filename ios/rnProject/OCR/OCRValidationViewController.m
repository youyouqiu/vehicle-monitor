//
//  OCRValidationViewController.m
//  scanning
//
//  Created by zwkj on 2019/6/24.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "OCRValidationViewController.h"
#import "AppDelegate.h"
#import "OCRPeopleIdCardInfoViewController.h"
#import "NSString+Category.h"
#import "OCRServices.h"
#import "OCRSingleton.h"
#import "ToastView.h"
#import "PhotoFullScreen.h"
#import "MyUITapGestureRecognizer.h"

#define UIColorFromRGB(rgbValue) [UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 green:((float)((rgbValue & 0xFF00) >> 8))/255.0 blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

@interface OCRValidationViewController ()<UITableViewDelegate, UITableViewDataSource, UITextFieldDelegate, UIPickerViewDataSource, UIPickerViewDelegate>

@property (nonatomic, strong) UILabel *monitorNameLabel;
@property (nonatomic, strong) UIImageView *idCardImageView;
@property (nonatomic, strong) UILabel *nameLabel;
@property (nonatomic, strong) UILabel *genderLabel;
@property (nonatomic, strong) UILabel *cardLabel;
@property (nonatomic, strong) UIButton *uploadButton;
@property (nonatomic, strong) UITextField *currentTextField; // 当前输入框
@property (nonatomic, strong) UITextField *nameTextField; // 姓名输入框
@property (nonatomic, strong) UITextField *idCardTextField; // 姓名输入框
@property (nonatomic, assign) NSInteger textLocation;//这里声明一个全局属性，用来记录输入位置
@property (nonatomic, strong) UIView *pickerContainerView; // 性别选择器
@property (nonatomic, strong) NSString *gender;
@property (nonatomic, strong) UIButton *genderButton; // 性别按钮
@property (nonatomic, assign) CGFloat originY;

@end

@implementation OCRValidationViewController

- (void)viewWillAppear:(BOOL)animated {
  if ([self.navigationController respondsToSelector:@selector(interactivePopGestureRecognizer)]) {
    self.navigationController.interactivePopGestureRecognizer.enabled = NO;
  }
  self.navigationController.navigationBar.topItem.title = @"";
  self.navigationController.navigationBar.barTintColor = UIColorFromRGB(0x339eff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:255/255.0 alpha:1];
  [self.navigationController.navigationBar setTitleTextAttributes:
   @{NSFontAttributeName:[UIFont systemFontOfSize:18],
     NSForegroundColorAttributeName:[UIColor whiteColor]}];
  [[UINavigationBar appearance] setTintColor:[UIColor whiteColor]];
//  [super.navigationController setNavigationBarHidden:NO animated:YES];
  self.navigationController.navigationBarHidden = NO;
  [OCRSingleton sharedSingleton].isNativePage = YES;
  self.title = @"确认信息";
  [super viewWillAppear:animated];
}

//- (void)viewWillDisappear:(BOOL)animated
//{
//  self.navigationController.navigationBarHidden = YES;
//}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  self.originY = self.view.frame.origin.y;
}

- (void)viewDidLoad {
  [super viewDidLoad];
//  self.originY = self.view.frame.origin.y;
  [self initPage];
//  [self getData];
  // 键盘输入变化通知
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(textFiledEditChanged:)name:UITextFieldTextDidChangeNotification object:nil];
  // 键盘出现的通知
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillShow:)name:UIKeyboardWillShowNotification object:nil];
  // 键盘消失的通知
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillHide:)name:UIKeyboardWillHideNotification object:nil];
}

-(void)initPage
{
  CGFloat height = self.view.frame.size.height;
  CGFloat width = self.view.frame.size.width;
  UITableView *tableView = [[UITableView alloc] initWithFrame:CGRectMake(0, 0, width, height)];
  tableView.delegate = self;
  tableView.dataSource = self;
  tableView.tableFooterView = [[UIView alloc] init];
  [self.view addSubview:tableView];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  static NSString *text = @"UITableViewPeopleCardValidate";
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:text];
  if (cell == nil) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleValue1 reuseIdentifier:text];
  }
  if (indexPath.row == 0) {
    NSDictionary *data = [self.peopleCardInfoData objectAtIndex:indexPath.row];
    NSString *value = [data objectForKey:@"value"];
    UILabel *nameLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, self.view.frame.size.width, 44)];
    nameLabel.textAlignment = NSTextAlignmentCenter;
    [nameLabel setText:value];
    [cell addSubview:nameLabel];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else if (indexPath.row == 2) {
    NSDictionary *data = [self.peopleCardInfoData objectAtIndex:indexPath.row];
    NSString *value = [data objectForKey:@"value"];
    UILabel *textLabel = [[UILabel alloc] initWithFrame:CGRectMake(50, 0, self.view.frame.size.width - 50, 44)];
    [textLabel setText:value];
    textLabel.textColor = [UIColor grayColor];
//    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    [cell addSubview:textLabel];
  }
  else if (indexPath.row == 1) {
    NSDictionary *data = [self.peopleCardInfoData objectAtIndex:indexPath.row];
    UIImage *image = [data objectForKey:@"value"];
    UIImageView *imageview = [[UIImageView alloc] initWithFrame:CGRectMake(40, 0, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
    imageview.contentMode = UIViewContentModeScaleAspectFit;
    imageview.image = image;
    imageview.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
    imageview.layer.borderWidth = 1.0f;
    
    imageview.userInteractionEnabled = YES;
    MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
    singleTap.image = image;
    [imageview addGestureRecognizer:singleTap];
    
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    [cell addSubview:imageview];
  } else if (indexPath.row == 6) {
    self.uploadButton = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadButton setTitle:@"确认上传" forState:UIControlStateNormal];
    self.uploadButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadButton.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:255/255.0 alpha:1];
    self.uploadButton.layer.cornerRadius = 5;
    [self.uploadButton addTarget:self action:@selector(uploadIdCard) forControlEvents:UIControlEventTouchUpInside];
    [cell addSubview:self.uploadButton];
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else if (indexPath.row == 3) {
    NSDictionary *data = [self.peopleCardInfoData objectAtIndex:indexPath.row];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    self.nameTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.nameTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.nameTextField.delegate = self;
    self.nameTextField.textAlignment = NSTextAlignmentRight;
    self.nameTextField.returnKeyType = UIReturnKeyDone;
    self.nameTextField.text = value;
    self.nameTextField.tag = 3;
    self.nameTextField.placeholder = @"请输入姓名";
    [self.nameTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.nameTextField];
  } else if (indexPath.row == 5) {
    NSDictionary *data = [self.peopleCardInfoData objectAtIndex:indexPath.row];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    self.idCardTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.idCardTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.idCardTextField.delegate = self;
    self.idCardTextField.textAlignment = NSTextAlignmentRight;
    self.idCardTextField.returnKeyType = UIReturnKeyDone;
    self.idCardTextField.text = value;
    self.idCardTextField.tag = 5;
    self.idCardTextField.keyboardType = UIKeyboardTypeASCIICapable;
    self.idCardTextField.placeholder = @"请输入身份证号";
    [self.idCardTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.idCardTextField];
  } else if (indexPath.row == 4) {
    NSDictionary *data = [self.peopleCardInfoData objectAtIndex:indexPath.row];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.genderButton = [[UIButton alloc] initWithFrame:CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    [self.genderButton setTitle:value forState:UIControlStateNormal];

    self.genderButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentRight;
    [self.genderButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
    [self.genderButton addTarget:self action:@selector(selectedGendder) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview: self.genderButton];
    
    // 添加性别选择器
    [self addGenderPickerView];
  }
  cell.selectionStyle = UITableViewCellSelectionStyleNone;
  return cell;
}

/**
 * 添加性别选择器
 */
- (void)addGenderPickerView
{
  CGFloat width = self.view.frame.size.width;
  CGFloat height = self.view.frame.size.height;
  self.pickerContainerView = [[UIView alloc] initWithFrame:CGRectMake(0, height, width, 230)];
  self.pickerContainerView.backgroundColor = [UIColor whiteColor];
  self.pickerContainerView.layer.borderWidth = 1;
  self.pickerContainerView.layer.borderColor = [UIColor colorWithRed:0 green:0 blue:0 alpha:0.1].CGColor;
  
  UIButton *btnOK = [[UIButton alloc] initWithFrame:CGRectMake(width - 75, 5, 40, 30)];
  btnOK.titleLabel.font = [UIFont systemFontOfSize:18.0];
  [btnOK setTitle:@"确定" forState:UIControlStateNormal];
  [btnOK setTitleColor:UIColorFromRGB(0x339eff) forState:UIControlStateNormal];
  [btnOK addTarget:self action:@selector(pickerViewBtnOk:) forControlEvents:UIControlEventTouchUpInside];
  [self.pickerContainerView addSubview:btnOK];
  
  UIButton *btnCancel = [[UIButton alloc] initWithFrame:CGRectMake(30, 5, 40, 30)];
  btnCancel.titleLabel.font = [UIFont systemFontOfSize:18.0];
  [btnCancel setTitle:@"取消" forState:UIControlStateNormal];
  [btnCancel setTitleColor:UIColorFromRGB(0x339eff) forState:UIControlStateNormal];
  [btnCancel addTarget:self action:@selector(pickerViewBtnCancel:) forControlEvents:UIControlEventTouchUpInside];
  [self.pickerContainerView addSubview:btnCancel];
  
  UIPickerView *pickView = [[UIPickerView alloc] initWithFrame:CGRectMake(0, 30, self.view.frame.size.width, 180)];
  pickView.delegate = self;
  pickView.dataSource = self;
  pickView.backgroundColor = [UIColor whiteColor];
  [self.pickerContainerView addSubview:pickView];
  [self.view addSubview:self.pickerContainerView];
}

-(void)textFiledEditChanged:(NSNotification *)obj
{
  UITextField *textField = (UITextField *)obj.object;
  NSInteger tag = textField.tag;
  NSString *text = textField.text;
  if (tag == 3) {
    [self validateNameTextField:textField string:text];
  } else if (tag == 5) {
    [self validateIdCardTextField:textField string:text];
  }
}

- (void)keyboardWillShow:(NSNotification *)notification {
  // 获取键盘高度
  CGFloat kbHeight = [[notification.userInfo objectForKey:UIKeyboardFrameEndUserInfoKey] CGRectValue].size.height;
  
  // 计算出键盘顶端到输入框底端的距离
  CGRect tFActualFrame = [self.currentTextField convertRect:self.currentTextField.frame toView:self.view];  // textField在self.view中的实际frame
  
  CGFloat offset;
  
  offset = tFActualFrame.origin.y + tFActualFrame.size.height - (self.view.frame.size.height - kbHeight - 30);  // Keyboard_Interval为自定义的textField与键盘保持的距离
  
  // 键盘动画时间
  double duration = [[notification.userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  
  // 将视图上移计算好的偏移
  if (offset > 0) {
    [UIView animateWithDuration:duration animations:^{
      self.view.frame = CGRectMake(0, -offset, self.view.frame.size.width, self.view.frame.size.height);
    }];
  }
}

// 键盘消失事件
- (void)keyboardWillHide:(NSNotification *)notification {
  // 键盘动画时间
  double duration = [[notification.userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  
  // 视图恢复原位置
  [UIView animateWithDuration:duration animations:^{
    self.view.frame = CGRectMake(0, self.originY, self.view.frame.size.width, self.view.frame.size.height);
  }];
}


/**
 * textField获取焦点
 */
- (void)textFieldDidBeginEditing:(UITextField *)textField
{
  self.currentTextField = textField;
  self.textLocation = [textField.text length];
  [self viewAnimation:self.pickerContainerView willHidden:YES];
}

/**
 * 姓名输入框验证
 */
- (void)validateNameTextField:(UITextField *)textField string:(NSString *)text
{
  NSString *lang = [[textField textInputMode] primaryLanguage];
  if ([lang isEqualToString:@"zh-Hans"]) {
    UITextRange *selectedRange = [textField markedTextRange];
    UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
    if (!position) {
      if ([text validateChineseEng]) {
        if ([text length] > 8)
        {
          textField.text = [text subBytesOfstringToIndex:8];
        }
      } else {
        textField.text = [text substringToIndex:self.textLocation];
      }
      self.textLocation = [textField.text length];
    }
  } else if ([lang isEqualToString:@"en-US"]) {
    if ([text validateChineseEng]) {
      if ([text length] > 8) {
        textField.text = [text subBytesOfstringToIndex:8];
      }
    } else {
      textField.text = [text substringToIndex:self.textLocation];
    }
    self.textLocation = [textField.text length];
  } else {
    textField.text = [text substringToIndex:self.textLocation];
  }
}

- (void)validateIdCardTextField:(UITextField *)textField string:(NSString *)text
{
  UITextRange *selectedRange = [textField markedTextRange];
  UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
  if (!position) {
    // 中文和英文一起检测  中文是两个字符
    if (![text validateIdCard]) {
      textField.text = [text substringToIndex:self.textLocation];
    } else if ([text length] > 18) {
      textField.text = [text substringToIndex:self.textLocation];
    }
    self.textLocation = [textField.text length];
  }
}

- (BOOL)textField:(UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  return YES;
}

-(void)textfieldDone
{
  [self viewAnimation:self.pickerContainerView willHidden:YES];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  return 7;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
  return 1;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.row == 1) {
    return (self.view.frame.size.width - 80) * 0.56 + 15;
  }
  return 44;
}

/**
 * 上传证件
 */
- (void)uploadIdCard
{
  UIImage *image = [[self.peopleCardInfoData objectAtIndex:1] objectForKey:@"value"];
  NSDictionary *imageData = @{
                              @"decodeImage": image,
                            };
  [[OCRServices shardService] uploadImage:imageData
                           successHandler:^(id result) {
                             NSLog(@"sss");
                             NSInteger statusCode = [[result objectForKey:@"statusCode"] integerValue];
                             BOOL success = [[result objectForKey:@"success"] boolValue];
                             if (statusCode == 200 && success == YES) {
                               NSDictionary *data = [result objectForKey:@"obj"];
                               NSString *newImageUrl = [data objectForKey:@"imageFilename"];
                               [self uploadIdCardInfo:newImageUrl];
                             }
                           }
                              failHandler:^(NSError *err) {
                                if (err.code == 50050) {
                                  dispatch_async(dispatch_get_main_queue(), ^{
                                    [[ToastView shareInstance] makeToast:@"登录失效，请重新登录" duration:2.0];
                                    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                                      NSArray *controllers = self.navigationController.viewControllers;
                                      self.navigationController.navigationBarHidden = YES;
                                      [self.navigationController popToViewController:[controllers objectAtIndex:controllers.count - 4] animated:YES];
                                    });
                                  });
                                } else {
                                  dispatch_async(dispatch_get_main_queue(), ^{
                                    [[ToastView shareInstance] makeToast:@"上传失败" duration:2.0];
                                  });
                                }
                              }];
  
}

/**
 * 上传基本信息
 */
-(void)uploadIdCardInfo:(NSString *)idCardImageUrl
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSString *nation = [[self.peopleCardInfoData objectAtIndex:8] objectForKey:@"value"];
    NSString *birthday = [[self.peopleCardInfoData objectAtIndex:6] objectForKey:@"value"];
    NSString *address = [[self.peopleCardInfoData objectAtIndex:7] objectForKey:@"value"];
    NSDictionary *params = @{
                             @"monitorId": [OCRSingleton sharedSingleton].monitorId,
                             @"name": self.nameTextField.text,
                             @"gender": [self.gender isEqualToString:@"男"] ? @"1" : @"2",
                             @"identityCardPhoto": idCardImageUrl,
                             @"nation": nation,
                             @"birthday": birthday,
                             @"address": address,
                             @"identity": self.idCardTextField.text,
                             @"oldIdentityCardPhoto": [OCRSingleton sharedSingleton].oldPhotoUrl,
                             };
    [[OCRServices shardService] uploadIdCardInfo:params
                                  successHandler:^(id result) {
                                    NSLog(@"ssss");
                                    NSInteger statusCode = [[result objectForKey:@"statusCode"] integerValue];
                                    BOOL success = [[result objectForKey:@"success"] boolValue];
                                    if (statusCode == 200 && success == YES) {
                                      dispatch_async(dispatch_get_main_queue(), ^{
                                        [[ToastView shareInstance] makeToast:@"上传成功" duration:2.0];
                                        [OCRSingleton sharedSingleton].isLoadData = YES;
                                        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                                          NSArray *controllers = self.navigationController.viewControllers;
                                          [self.navigationController popToViewController:[controllers objectAtIndex:controllers.count - 3] animated:YES];
                                        });
                                        
                                      });
                                    } else {
                                      dispatch_async(dispatch_get_main_queue(), ^{
                                        [[ToastView shareInstance] makeToast:@"上传失败" duration:2.0];
                                      });
                                    }
                                  }
                                     failHandler:^(NSError *err) {
                                       if (err.code == 50050) {
                                         dispatch_async(dispatch_get_main_queue(), ^{
                                           [[ToastView shareInstance] makeToast:@"登录失效，请重新登录" duration:2.0];
                                           dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                                             NSArray *controllers = self.navigationController.viewControllers;
                                             self.navigationController.navigationBarHidden = YES;
                                             [self.navigationController popToViewController:[controllers objectAtIndex:controllers.count - 4] animated:YES];
                                           });
                                         });
                                       } else {
                                         dispatch_async(dispatch_get_main_queue(), ^{
                                           [[ToastView shareInstance] makeToast:@"上传失败" duration:2.0];
                                         });
                                       }
                                     }];
  });
}

/**
 * 性别选择器显示
 */
-(void)selectedGendder
{
  [self.view endEditing:YES];
  [self viewAnimation:self.pickerContainerView willHidden:NO];
  if (self.gender == nil) {
    self.gender = @"男";
  }
}

/**
 * 选择器确定按钮
 */
- (void)pickerViewBtnOk:(UIButton *)btn
{
//  self.pickerContainerView.hidden = YES;
  [self viewAnimation:self.pickerContainerView willHidden:YES];
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [self.genderButton setTitle:self.gender forState:UIControlStateNormal];
  });
}

/**
 * 选择器取消按钮
 */
- (void)pickerViewBtnCancel:(UIButton *)btn
{
  [self viewAnimation:self.pickerContainerView willHidden:YES];
}

/**
 * 选择器显示与隐藏动画
 */
- (void)viewAnimation:(UIView*)view willHidden:(BOOL)hidden {
  CGFloat height = self.view.frame.size.height;
  CGFloat width = self.view.frame.size.width;
  [UIView animateWithDuration:0.3 animations:^{
    if (hidden) {
      view.frame = CGRectMake(0, height, width, 180);
    } else {
      [view setHidden:hidden];
      view.frame = CGRectMake(0, height - 180, width, 180);
    }
  } completion:^(BOOL finished) {
    [view setHidden:hidden];
  }];
}

/**
 * 设置UIPickerView列数
 */
- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)pickerView
{
  return 1;
}

/**
 * 设置UIPickerView行数
 */
- (NSInteger)pickerView:(UIPickerView *)pickerView numberOfRowsInComponent:(NSInteger)component
{
  return 2;
}

/**
 * 设置UIPickerView每一列的内容
 */
- (NSString *)pickerView:(UIPickerView *)pickerView titleForRow:(NSInteger)row forComponent:(NSInteger)component
{
  if (row == 0) {
    return @"男";
  } else {
    return @"女";
  }
}

- (void)pickerView:(UIPickerView *)pickerView didSelectRow:(NSInteger)row inComponent:(NSInteger)component
{
  if (row == 0) {
    self.gender = @"男";
  } else if (row == 1) {
    self.gender = @"女";
  }
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  // 收起键盘
  [self.view endEditing:YES];
}

-(void)dealloc {
  [self viewAnimation:self.pickerContainerView willHidden:YES];
  [self.view endEditing:YES];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UITextFieldTextDidChangeNotification object:nil];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
  // 键盘消失的通知
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
}

- (void)handleSingleTap:(UITapGestureRecognizer *)gestureRecognizer {
  MyUITapGestureRecognizer *tap = (MyUITapGestureRecognizer *)gestureRecognizer;
  [[PhotoFullScreen shareInstances] makeToast:tap.image];
}

@end
