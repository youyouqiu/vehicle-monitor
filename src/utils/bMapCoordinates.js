/**
 * Created by aoxianghua on 2018/10/8.
 */

/**
 * 高德坐标转百度(传入经度、纬度)
 */
export const bdEncrypt = (aMapLng, aMapLat) => {
  if ((aMapLng === 0 || aMapLng) && (aMapLat === 0 || aMapLat)) {
    const X_PI = Math.PI * 3000.0 / 180.0;
    const x = aMapLng;
    const y = aMapLat;
    const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * X_PI);
    const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * X_PI);
    const bdLng = z * Math.cos(theta) + 0.0065;
    const bdLat = z * Math.sin(theta) + 0.006;
    return {
      bdLat,
      bdLng,
    };
  }
  return {
    bdLat: 1000,
    bdLng: 1000,
  };
};