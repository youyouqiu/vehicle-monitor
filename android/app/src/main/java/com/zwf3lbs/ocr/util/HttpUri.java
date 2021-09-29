package com.zwf3lbs.ocr.util;

public class HttpUri {

    //获取人员的身份证信息
    public static String getIdentityCardInfo = "/clbs/app/appOcr/monitorInfo/getIdentityCardInfo";

    //上传人员身份证信息
    public static String uploadIdentityCardInfo = "/clbs/app/appOcr/monitorInfo/uploadIdentityCardInfo";

    //修改车辆照片上传路径(上传图片到fastdfs)
    public static String uploadImg = "/clbs/app/appOcr/monitorInfo/uploadImage";

    //获取车辆的行驶证信息
    public static String getVehicleDriveLicenseInfo = "/clbs/app/appOcr/monitorInfo/getVehicleDriveLicenseInfo";

    //上传车辆行驶证正本信息
    public static String uploadVehicleDriveLicenseFrontInfo = "/clbs/app/appOcr/monitorInfo/uploadVehicleDriveLicenseFrontInfo";

    //上传车辆行驶证副本信息
    public static String uploadVehicleDriveLicenseDuplicateInfo = "/clbs/app/appOcr/monitorInfo/uploadVehicleDriveLicenseDuplicateInfo";

    //获取车辆的运输证信息
    public static String getTransportNumberInfo = "/clbs/app/appOcr/monitorInfo/getTransportNumberInfo";

    //上传车辆运输证信息
    public static String uploadTransportNumberInfo = "/clbs/app/appOcr/monitorInfo/uploadTransportNumberInfo";

    //获取车辆照片
    public static String getVehiclePhotoInfo = "/clbs/app/appOcr/monitorInfo/getVehiclePhotoInfo";

    //APP上传车辆图片
    public static String uploadVehiclePhoto = "/clbs/app/appOcr/monitorInfo/uploadVehiclePhoto";

    //从业人员上传 type:  1：上传身份证 2：上传驾照 3：上传从业资格
    public static String uploadProfessional = "/clbs/app/ocr/professionals/saveInfo";

    //获取从业人员信息
    public static String getProfessionalInfo = "/clbs/app/ocr/professionals/getInfo";

    //获取从业人员列表
    public static String getProfessionalList = "/clbs/app/ocr/professionals/getList";

    //绑定从业人员
    public static String bindProfessional = "/clbs/app/ocr/professionals/bind";





}
