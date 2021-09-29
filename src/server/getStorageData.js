import getStorage from '../utils/getAsyncStorage';

/**
 * 获取所有登录用户信息
 */
export const getLoginAccont = () => getStorage({ key: 'loginAccont' });

/**
 * 当前登录用户名
 */
export const getCurAccont = () => getStorage({ key: 'curAccont' });

/**
 * 登录状态
 */
export const getLoginState = () => getStorage({ key: 'loginState' });

/**
 * 获取语言
 */
export const getAppLang = () => getStorage({ key: '_lang_' });

/**
 * 获取app自定义信息
 */
export const getUserSetting = () => getStorage({ key: 'appSettings' });

/**
 * 当前登录用户报警类型开关配置
 */
export const getCheckAlarmType = () => getStorage({ key: 'checkSwitch' });

/**
 * 当前登录用户清除报警数据时间
 */
export const getClearAlarmTime = () => getStorage({ key: 'clearAlarmTime' });

/**
 * 获取用户进入的最大版本号
 */
export const getMaxLoginVersion = () => getStorage({ key: 'maxLoginVersion' });

/**
 * 获取设备id号
 */
export const getStorageClientId = () => getStorage({ key: 'clientId' });

/**
 * 获取http缓存配置
 */
export const getStorageHttpConfig = () => getStorage({ key: 'httpConfig' });

/**
 * 获取存储的用户缓存
    *{ username:{
    *  'monitorSearchHistory':'综合统计对象搜索历史',
    *  'groupSearchHistory':'综合统计分组搜索历史',
    *  'searchHistory':'查找监控对象搜索历史',
    *  'messageRemind':{'消息中心是否有新消息或者用户未读',oldRemindInfos:'上次登录查询的消息提醒数据'}
    * }}
 */
export const getUserStorage = () => getStorage({ key: 'userStorage' });

/**
 * 获取到期提醒开关是否开启
 */
export const getDueToRemind = () => getStorage({ key: 'dueToRemind' });
/**
 * 获取视频画质开关是否开启
 */
export const getVideoSwitch = () => getStorage({ key: 'videoSwitch' });
/**
 * 获取速度设置值
 */
export const getspeedValues = () => getStorage({ key: 'speedSlider' });

// 获取用户协议选择
export const getXYStorage = () => getStorage({ key: 'rememberYX' });

/**
 * 获取用户报警开关是否关闭
 */
 export const getAlarmSwitchCurState = () => getStorage({ key: 'alarmSwitchCurState' });
