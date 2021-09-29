/* eslint no-restricted-globals:off */
import { is } from 'immutable';
/**
 * 保留指定小数位
 * @param {*} source 要转换的对象
 * @param {Number} digit 保留的小数位
 * @param {Boolean}} omitZero 是否省略最末尾的0
 */
export function toFixed(source, digit, omitZero) {
  let sourceIn = source;
  if (typeof sourceIn !== 'number') {
    try {
      sourceIn = parseFloat(sourceIn);
    } catch (error) {
      return 0;
    }
  }
  if (sourceIn === null || sourceIn === undefined || isNaN(sourceIn)) {
    return 0;
  }
  let afterFixed = sourceIn.toFixed(digit); // 此时 afterFixed 为string类型
  if (omitZero) {
    afterFixed = parseFloat(afterFixed);
  }
  return afterFixed;
}

/**
 * @param {*} source 要转换的对象
 * @param {Number} defaultValue  转换不成功时的默认返回值
 */
export function tryParseFloat(source, defaultValue = 0) {
  const r = parseFloat(source);
  if (!Number.isNaN(r)) {
    return r;
  }
  return defaultValue;
}

/**
 * 判断对象是否为空
 * @param {Object} obj 需要判断的对象，可以是日期，对象，数组，Immutalbe类型的
 */
export function isEmpty(obj) {
  if (obj instanceof Date) {
    return false;
  }
  if (obj === undefined || obj === null) {
    return true;
  }
  if (typeof obj === 'object') {
    if (obj.size !== undefined) {
      return obj.size === 0;
    }
    return Object.keys(obj).length === 0 || obj.length === 0;
  }
  return false;
}

/**
 * 秒折合多少小时，包含一位小数
 * @param {Number} second 秒
 */
export function getHourFromSecond(second) {
  const hourSecond = 60 * 60;
  let hour = second / hourSecond;
  hour = toFixed(hour, 1, true);
  return hour;
}

/**
 * 秒的人性化显示，大于等于十分钟显示 多少h
 * 小于十分钟显示几m几s
 * @param {String} 完整的时间文本
 */
export function getTextFromSecond(second) {
  if (second >= 10 * 60) {
    return `${getHourFromSecond(second).toString()} h`;
  }
  const minute = Math.floor(second / 60);
  const remainSecond = second - (minute * 60);
  return `${minute} m ${remainSecond} s`;
}

/**
 * 秒的人性化显示，按几小时几份几秒显示
 * @param {String} 完整的时间文本
 */
export function getChineseFromSecond(second) {
  const hour = Math.floor(second / (60 * 60));
  let remainSecond = second - (hour * 60 * 60);
  const minute = Math.floor(remainSecond / 60);
  remainSecond -= (minute * 60);
  return `${hour}小时${minute}分${remainSecond}秒`;
}

/**
 * 秒的人性化显示，大于等于十分钟显示 多少h
 * 小于十分钟显示几分几秒
 * @param {Object} {h,m,s} 时分秒 对象
 */
export function getObjFromSecond(second) {
  if (second >= 0 && second < 10 * 60) {
    const minute = Math.floor(second / 60);
    const remainSecond = second - (minute * 60);
    return { m: minute, s: remainSecond };
  }
  return { h: getHourFromSecond(second) };
}

/**
 * 秒折合多少分钟，包含一位小数
 * @param {Number} second 秒
 */
export function getMinuteFromSecond(second) {
  const minuteSecond = 60;
  let minute = second / minuteSecond;
  minute = toFixed(minute, 1, true);
  return minute;
}

/**
 * 从一维数组创建二维数组
 * @param {Array} array 源数组
 * @param {Number} radix 子数组的长度
 */
export function get2DimensionArray(array, radix) {
  const arr = array;

  const newArr = [];
  while (arr.length) newArr.push(arr.splice(0, radix));
  return newArr;
}


export function printKeys(obj) {
  if (isEmpty(obj)) {
    // console.warn(obj);
  } else {
    // console.warn(Object.keys(obj).join(','));
  }
}

// 是否含有中文（也包含日文和韩文）
export function isChineseChar(str) {
  const reg = /[^/u4e00\-/u9fa5]/;
  return reg.test(str);
}

function getNow(s) {
  return s < 10 ? `0${s}` : s;
}

/**
 * 获取当前日期
 * @param {*} type : 0年月日 时分秒
 * @param {*} type : 1年月日
 * @param {*} type : 2时分秒
 */
export function getCurrentTime(type) {
  const myDate = new Date();
  // 获取当前年
  const year = myDate.getFullYear();
  // 获取当前月
  const month = myDate.getMonth() + 1;
  // 获取当前日
  const date = myDate.getDate();
  const h = myDate.getHours(); // 获取当前小时数(0-23)
  const m = myDate.getMinutes(); // 获取当前分钟数(0-59)
  const s = myDate.getSeconds();

  let now;
  if (type === 0) {
    now = `${year}-${getNow(month)}-${getNow(date)} ${getNow(h)}:${getNow(m)}:${getNow(s)}`;
  } else if (type === 1) {
    now = `${year}-${getNow(month)}-${getNow(date)}`;
  } else if (type === 2) {
    now = `${getNow(h)}:${getNow(m)}:${getNow(s)}`;
  }

  return now;
}

/**
 * 获取日期
 * @param {*} AddDayCount : 0今天，1明天，2后天，-1昨天
 */
export function GetDateStr(day, AddDayCount) {
  const dd = new Date(day);
  dd.setDate(dd.getDate() + AddDayCount);// 获取AddDayCount天后的日期
  const y = dd.getFullYear();
  const m = dd.getMonth() + 1;// 获取当前月份的日期
  const d = dd.getDate();
  return `${getNow(y)}-${getNow(m)}-${getNow(d)}`;
}

/**
 * 将日期格式化为年月日
 * 例如:1990-01-12 变成 1990年1月12日
 * @param {*} date:日期
 * @param {*} split:分割符
 * @param {*} type:0返回年月日 1返回年月 2返回月日
 */
export function formateDate(date, split, type) {
  const arr = date.split(split);
  let newDate = '';

  if (type === 0) {
    newDate = `${arr[0]}年${parseInt(arr[1], 10)}月${parseInt(arr[2], 10)}日`;
  } else if (type === 1) {
    newDate = `${arr[0]}年${parseInt(arr[1], 10)}月`;
  } else {
    newDate = `${parseInt(arr[1], 10)}月${parseInt(arr[2], 10)}日`;
  }

  return newDate;
}

/**
   * 返回一个从 `start` (包含) 到 `end` (不包含) 的数组
   * `step` 决定步长
   *
   *     Range(10,30,5) // [10,15,20,25]
   *
   */
export function range(start, end, step) {
  const arr = [];
  for (let i = start; i < end; i += step) {
    arr.push(i);
  }
  return arr;
}
/**
 *两个时间差值:
 *start:开始时间
 *end:结束时间
 */
export function getDateDiffer(start, end) {
  const time1 = start.replace(/-/g, '/');
  const time2 = end.replace(/-/g, '/');
  const d1 = new Date(time1).getTime();
  const d2 = new Date(time2).getTime();
  const timer = d2 - d1;

  const ms = 24 * 3600 * 1000;
  const d = parseInt(timer / ms, 10);
  const h = parseInt((timer % ms) / (3600 * 1000), 10);
  const m = parseInt(((timer % ms) % (3600 * 1000)) / (60 * 1000), 10);
  const s = parseInt(((timer % ms) % (3600 * 1000) % (60 * 1000)) / 1000, 10);
  const dateObj = {
    times: timer, // 时间ms
    d, // 天
    h, // 时
    m, // 分
    s, // 秒
  };

  return dateObj;
}

/**
 * 根据路径查找对象中是否有某个值
 * @param {object} source 源对象
 * @param {Array} pathArray 查找的路径数组，可以是数字和文本索引
 * @param {*} replacer 如果最后都没找到，返回的替换值
 */
export function findByPath(source, pathArray, replacer) {
  if (source === undefined || source === null) {
    return replacer;
  }
  let sourceRef = source;
  let i; let
    item;
  for (i = 0; i < pathArray.length; i += 1) {
    item = sourceRef[pathArray[i]];
    if (item === undefined || item === null) {
      return replacer;
    }
    sourceRef = item;
  }
  return item;
}

/**
 * 将秒转换成时分秒对象，形如 {hour:1,minute:30,second:00}
 */
export function second2Hms(secondParam) {
  let hour = 0;
  let minute = 0;
  let second = secondParam;
  hour = parseInt(second / 3600, 10);
  second -= hour * 3600;
  minute = parseInt(second / 60, 10);
  second -= minute * 60;
  return {
    hour,
    minute,
    second,
  };
}

/**
 * 如果传入的数字小于10，给前面加0
 * 返回字符串
 */
export function padZero(num) {
  if (num < 10) {
    return `0${num.toString()}`;
  }
  return num.toString();
}

/**
 * 将秒转换成时分秒文本，形如 00:00:00
 */
export function second2HmsText(secondParam) {
  const hms = second2Hms(secondParam);
  const { hour } = hms;
  const { minute } = hms;
  const { second } = hms;
  return `${padZero(hour)}:${padZero(minute)}:${padZero(second)}`;
}


/**
 * 计算时分秒的总秒数
 */
export function obj2Second(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return hour * 3600 + minute * 60 + second;
}

/**
 * 计算时分秒的总秒数
 */
export function obj2HmsText(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return `${padZero(hour)}:${padZero(minute)}:${padZero(second)}`;
}

/**
 * 解析平台的奇怪格式，形如 191202001504 代表 2019-12-02 00:15:04
 */
export function strangeDateParser(dateStr, status) {
  const charArray = dateStr.split('');
  const yearStr = `20${charArray[0]}${charArray[1]}`;
  const monthStr = `${charArray[2]}${charArray[3]}`;
  const dayStr = `${charArray[4]}${charArray[5]}`;
  const hourStr = `${charArray[6]}${charArray[7]}`;
  const minuteStr = `${charArray[8]}${charArray[9]}`;
  const secondStr = `${charArray[10]}${charArray[11]}`;

  if (status) {
    return `${yearStr}-${monthStr}-${dayStr} ${hourStr}:${minuteStr}:${secondStr}`;
  }

  return new Date(`${yearStr}/${monthStr}/${dayStr} ${hourStr}:${minuteStr}:${secondStr}`);
}

/**
 * 格式化为平台的奇怪格式，形如 2019-12-02 00:15:04 转化为 191202001504
 */
export function strangeDateFormater(date) {
  const yearStr = date.getFullYear().toString().substr(2, 2);
  const monthStr = padZero(date.getMonth() + 1).toString();
  const dayStr = padZero(date.getDate()).toString();
  const hourStr = padZero(date.getHours()).toString();
  const minuteStr = padZero(date.getMinutes()).toString();
  const secondStr = padZero(date.getSeconds()).toString();

  return `${yearStr}${monthStr}${dayStr}${hourStr}${minuteStr}${secondStr}`;
}

/**
 * 深度（实际上就一层）比较两个对象是否相等
 * @param {*} a 需要比较的对象
 * @param {*} b 需要比较的对象
 * @param {*} keysParam 提供需要比较的key，如果不提供，就比较对象的所有key
 */
export function deepEqual(a, b, keysParam) {
  const keys = !keysParam ? Object.keys(a) : keysParam;
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (!is(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

/**
 * 数据对象排序
 * prop 为需要比较的key
 */
export const compare = function (prop) {
  return function (obj1, obj2) {
    const val1 = obj1[prop];
    const val2 = obj2[prop];
    return val1 - val2;
  };
};
