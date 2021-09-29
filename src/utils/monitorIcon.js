/**
 * Created by aoxianghua on 2018/10/11.
 */
import { requestConfig } from './env';

const httpBaseConfig = requestConfig();


/**
 * 组装监控对象图标url， 包括车、人和物
 */
export const monitorIcon = (monitorType, icon) => {
  let objIcon;
  const url = `http://${httpBaseConfig.baseUrl}:${httpBaseConfig.port}/clbs/resources/img`;
  if (monitorType === 0) { // 车
    if (icon === undefined || icon === null) {
      objIcon = `${url}/vehicle.png`;
    } else {
      objIcon = `${url}/vico/${icon}`;
    }
  } else if (monitorType === 1) { // 人
    if (icon === undefined || icon === null) {
      objIcon = `${url}/123.png`;
    } else {
      objIcon = `${url}/vico/${icon}`;
    }
  } else if (monitorType === 2) { // 物
    if (icon === undefined || icon === null) {
      objIcon = `${url}/thing.png`;
    } else {
      objIcon = `${url}/vico/${icon}`;
    }
  }
  return objIcon;
};