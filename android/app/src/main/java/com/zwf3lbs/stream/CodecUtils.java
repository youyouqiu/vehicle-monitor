package com.zwf3lbs.stream;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.media.MediaCodecInfo;
import android.media.MediaCodecInfo.CodecCapabilities;
import android.media.MediaCodecInfo.CodecProfileLevel;
import android.media.MediaCodecList;
import android.os.Build;
import android.os.Environment;
import android.text.TextUtils;
import android.util.Log;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Locale;


//https://github.com/Bilibili/ijkplayer/blob/master/ijkmedia/ijksdl/android/ijksdl_codec_android_mediadef.h
//http://blog.csdn.net/u013531497/article/details/36429237

public class CodecUtils {
	private static final String TAG = CodecUtils.class.getSimpleName();

	/**
	 * Returns the first codec capable of encoding the specified MIME type, or
	 * null if no match was found.
	 */
	public static MediaCodecInfo selectCodec(String mimeType) {
		int numCodecs = MediaCodecList.getCodecCount();
		for (int i = 0; i < numCodecs; i++) {
			MediaCodecInfo codecInfo = MediaCodecList.getCodecInfoAt(i);

			if (!codecInfo.isEncoder()) {
				continue;
			}

			String[] types = codecInfo.getSupportedTypes();
			if (types == null)
				continue;

			for (int j = 0; j < types.length; j++) {
				if (types[j].equalsIgnoreCase(mimeType)) {
					return codecInfo;
				}
			}
		}
		return null;
	}

	/**
	 * Returns the best codec capable of decoding the specified MIME type, or
	 * null if no match was found.
	 */
	public static String selectBestDecoder(String mimeType, int width, int height) {

		if (TextUtils.isEmpty(mimeType))
			return null;
		Log.d(TAG,"select beset decoder:" + mimeType + " "+width+"x"+height);

		ArrayList<SCMediaCodecInfo> candidateCodecList = new ArrayList<SCMediaCodecInfo>();
		int numCodecs = MediaCodecList.getCodecCount();
		for (int i = 0; i < numCodecs; i++) {
			MediaCodecInfo codecInfo = MediaCodecList.getCodecInfoAt(i);

			if (codecInfo.isEncoder()) {
				continue;
			}

			String[] types = codecInfo.getSupportedTypes();
			if (types == null)
				continue;
			for (int j = 0; j < types.length; j++) {
				Log.d(TAG,"supported codec:" + types[j]);
				if (types[j].equalsIgnoreCase(mimeType)) {
					SCMediaCodecInfo candidate = SCMediaCodecInfo
							.setupCandidate(codecInfo, mimeType);
					if (candidate == null)
						continue;
					
					if(width>0 && height>0) {
						if(!candidate.checkResolution(mimeType, width, height))
							continue;
					}
					
					candidateCodecList.add(candidate);
					Log.i(TAG,String.format(Locale.US,
							"candidate codec: %s rank=%d", codecInfo.getName(),
							candidate.mRank));
					candidate.dumpProfileLevels(mimeType);
					// break;
				}
			}
		}

		if (candidateCodecList.isEmpty()) {
			Log.d(TAG,"candidateCodecList is empty");
			return null;
		} else {
			Log.d(TAG,"candidateCodecList is "+candidateCodecList.size());
		}

		SCMediaCodecInfo bestCodec = candidateCodecList.get(0);

		for (SCMediaCodecInfo codec : candidateCodecList) {
			if (codec.mRank > bestCodec.mRank) {
				
				bestCodec = codec;
			}
		}

		if (bestCodec.mRank < SCMediaCodecInfo.RANK_LAST_CHANCE) {
			Log.w(TAG,String.format(Locale.US, "unaccetable codec: %s, rank:%d",
					bestCodec.mCodecInfo.getName(), bestCodec.mRank));
			return null;
		}

		Log.i(TAG,String.format(Locale.US, "selected codec: %s rank=%d",
				bestCodec.mCodecInfo.getName(), bestCodec.mRank));
		return bestCodec.mCodecInfo.getName();
	}

	/**
	 * Returns a color format that is supported by the codec and by this test
	 * code. If no match is found, this throws a test failure -- the set of
	 * formats known to the test should be expanded for new platforms.
	 */
	public static int selectColorFormat(MediaCodecInfo codecInfo,
			String mimeType) {
		int result = 0;
		CodecCapabilities capabilities = codecInfo
				.getCapabilitiesForType(mimeType);

		// surface android 4.3以上用surface编码
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
			if (Arrays.binarySearch(capabilities.colorFormats,
					CodecCapabilities.COLOR_FormatSurface) >= 0) {
				result = CodecCapabilities.COLOR_FormatSurface;
			}
		}

		// rgb(rgb mediacodec编码有点问题,暂时不用)
		for (int i = 0; i < capabilities.colorFormats.length; i++) {
			int colorFormat = capabilities.colorFormats[i];

			Log.i(TAG,"[selectColorFormat] colorFormat:"
					+ colorFormatName(colorFormat));
			if (isRecognizedFormatRGB(colorFormat) && result == 0) {
				// result = colorFormat;
			}
		}
		// yuv
		if (result == 0) {
			for (int i = 0; i < capabilities.colorFormats.length; i++) {
				int colorFormat = capabilities.colorFormats[i];
				if (isRecognizedFormatYUV(colorFormat)) {
					return colorFormat;
				}
			}
		} else {
			return result;
		}
		Log.e(TAG,"couldn't find a good color format for " + codecInfo.getName()
				+ " / " + mimeType);
		return 0; // not reached
	}

	public final static int calcBufferSize(int colorFormat, int width,
			int height) {

		if (width <= 0 || height <= 0)
			return 0;

		if (isRecognizedFormatYUV(colorFormat))
			return width * height * 3 / 2;
		else if (isRecognizedFormatRGB(colorFormat))
			return width * height * getRGBBytesCount(colorFormat);
		else
			return 0;
	}

	public static int[] selectProfileLevel(MediaCodecInfo codecInfo,
			String mimeType) {
		String[] types = codecInfo.getSupportedTypes();
		for (int j = 0; j < types.length; j++) {
			if (types[j].equalsIgnoreCase(mimeType)) {

				CodecCapabilities codecCapabilities;
				try {
					codecCapabilities = codecInfo
							.getCapabilitiesForType(types[j]);
				} catch (Exception e) {
					continue;
				}
				// Profile level
				int profile = 0, level = 0;
				for (final CodecProfileLevel codecProfileLevel : codecCapabilities.profileLevels) {
					if (types[j].contains("avc")) {
						Log.i(TAG,"Profile: "
								+ avcProfileToString(codecProfileLevel.profile)
								+ ", Level: "
								+ avcLevelToString(codecProfileLevel.level));
						if (profile >= 0
								&& codecProfileLevel.profile <= CodecProfileLevel.AVCProfileHigh) {
							profile = Math.max(profile,
									codecProfileLevel.profile);
							level = Math.max(level, codecProfileLevel.level);
						}
					}
				}
				if (profile > 0 && level > 0) {
					int[] profile_level = new int[2];
					profile_level[0] = profile;
					profile_level[1] = level;
					return profile_level;
				}
				return null;
			}
		}
		Log.e(TAG,"couldn't find a good color format for " + codecInfo.getName()
				+ " / " + mimeType);
		return null; // not reached
	}

	/**
	 * Returns true if this is a color format that this test code understands
	 * (i.e. we know how to read and generate frames in this format).
	 */
	public static boolean isRecognizedFormatYUV(int colorFormat) {
		switch (colorFormat) {
		// these are the formats we know how to handle for this test
		case CodecCapabilities.COLOR_FormatYUV420Planar:
			// case CodecCapabilities.COLOR_FormatYUV420PackedPlanar:
		case CodecCapabilities.COLOR_FormatYUV420SemiPlanar:
			// case CodecCapabilities.COLOR_FormatYUV420PackedSemiPlanar:
			// case CodecCapabilities.COLOR_TI_FormatYUV420PackedSemiPlanar:

			// // from hardware samsung_slsi
			// case 0x7F000001://OMX_SEC_COLOR_FormatNV12TPhysicalAddress
			// case 0x7F000002://OMX_SEC_COLOR_FormatNV12LPhysicalAddress
			// case 0x7F000003://OMX_SEC_COLOR_FormatNV12LVirtualAddress
			// case 0x7FC00002://OMX_SEC_COLOR_FormatNV12Tiled
			// case 0x7F000010://OMX_SEC_COLOR_FormatNV21LPhysicalAddress
			// case 0x7F000011://OMX_SEC_COLOR_FormatNV21Linea

			// from hardware qcom
			// case CodecCapabilities.COLOR_QCOM_FormatYUV420SemiPlanar:
			// case
			// 0x7FA30C01://OMX_QCOM_COLOR_FormatYVU420PackedSemiPlanar32m4ka
			// case
			// 0x7FA30C02://OMX_QCOM_COLOR_FormatYUV420PackedSemiPlanar16m2ka
			// case
			// 0x7FA30C03://OMX_QCOM_COLOR_FormatYUV420PackedSemiPlanar64x32Tile2m8ka
			// case 0x7FA30C04://OMX_QCOM_COLOR_FormatYUV420PackedSemiPlanar32m
			// case
			// 0x7FA30C05://OMX_QCOM_COLOR_FORMATYUV420PackedSemiPlanar32mMultiView
			//
			// // from hardware intel
			// case 0x7FA00E00://OMX_INTEL_COLOR_FormatYUV420PackedSemiPlanar
			// case CodecCapabilities.COLOR_Format32bitBGRA8888:
			return true;
		default:
			return false;
		}
	}

	public static final int getRGBBytesCount(int colorFormat) {
		switch (colorFormat) {
		case CodecCapabilities.COLOR_Format32bitBGRA8888:
		case CodecCapabilities.COLOR_Format32bitARGB8888:
		case CodecCapabilities.COLOR_Format32bitABGR8888:
			return 4;

		case CodecCapabilities.COLOR_Format24bitRGB888:
		case CodecCapabilities.COLOR_Format24bitBGR888:
			return 3;
		default:
			return 0;
		}
	}

	public static boolean isRecognizedFormatRGB(int colorFormat) {
		switch (colorFormat) {
		case CodecCapabilities.COLOR_Format32bitBGRA8888:
		case CodecCapabilities.COLOR_Format32bitARGB8888:
		case CodecCapabilities.COLOR_Format32bitABGR8888:

		case CodecCapabilities.COLOR_Format24bitRGB888:
		case CodecCapabilities.COLOR_Format24bitBGR888:
			return true;
		default:
			return false;
		}
	}

	/**
	 * Returns true if the specified color format is semi-planar YUV. Throws an
	 * exception if the color format is not recognized (e.g. not YUV).
	 */
	public static boolean isSemiPlanarYUV(int colorFormat) {
		switch (colorFormat) {
		case CodecCapabilities.COLOR_FormatYUV420Planar:
		case CodecCapabilities.COLOR_FormatYUV420PackedPlanar:
			return false;
		case CodecCapabilities.COLOR_FormatYUV420SemiPlanar:
		case CodecCapabilities.COLOR_FormatYUV420PackedSemiPlanar:
		case CodecCapabilities.COLOR_TI_FormatYUV420PackedSemiPlanar:
			// // from hardware samsung_slsi
			// case 0x7F000001://OMX_SEC_COLOR_FormatNV12TPhysicalAddress
			// case 0x7F000002://OMX_SEC_COLOR_FormatNV12LPhysicalAddress
			// case 0x7F000003://OMX_SEC_COLOR_FormatNV12LVirtualAddress
			// case 0x7FC00002://OMX_SEC_COLOR_FormatNV12Tiled
			// case 0x7F000010://OMX_SEC_COLOR_FormatNV21LPhysicalAddress
			// case 0x7F000011://OMX_SEC_COLOR_FormatNV21Linea

			// from hardware qcom
		case CodecCapabilities.COLOR_QCOM_FormatYUV420SemiPlanar:
			// case
			// 0x7FA30C01://OMX_QCOM_COLOR_FormatYVU420PackedSemiPlanar32m4ka
			// case
			// 0x7FA30C02://OMX_QCOM_COLOR_FormatYUV420PackedSemiPlanar16m2ka
			// case
			// 0x7FA30C03://OMX_QCOM_COLOR_FormatYUV420PackedSemiPlanar64x32Tile2m8ka
			// case 0x7FA30C04://OMX_QCOM_COLOR_FormatYUV420PackedSemiPlanar32m
			// case
			// 0x7FA30C05://OMX_QCOM_COLOR_FORMATYUV420PackedSemiPlanar32mMultiView
			//
			// // from hardware intel
			// case 0x7FA00E00://OMX_INTEL_COLOR_FormatYUV420PackedSemiPlanar
			return true;
		default:
			Log.e(TAG,"[isSemiPlanarYUV]unknown format " + colorFormat);
			return false;
		}
	}

	public static String colorFormatName(int format) {
		String name;
		switch (format) {
		case CodecCapabilities.COLOR_Format12bitRGB444:
			name = "COLOR_Format12bitRGB444";
			break;
		case CodecCapabilities.COLOR_Format16bitARGB1555:
			name = "COLOR_Format16bitARGB1555";
			break;
		case CodecCapabilities.COLOR_Format16bitARGB4444:
			name = "COLOR_Format16bitARGB4444";
			break;
		case CodecCapabilities.COLOR_Format16bitBGR565:
			name = "COLOR_Format16bitBGR565";
			break;
		case CodecCapabilities.COLOR_Format16bitRGB565:
			name = "COLOR_Format16bitRGB565";
			break;
		case CodecCapabilities.COLOR_Format18BitBGR666:
			name = "COLOR_Format18BitBGR666";
			break;
		case CodecCapabilities.COLOR_Format18bitARGB1665:
			name = "COLOR_Format18bitARGB1665";
			break;
		case CodecCapabilities.COLOR_Format18bitRGB666:
			name = "COLOR_Format18bitRGB666";
			break;
		case CodecCapabilities.COLOR_Format19bitARGB1666:
			name = "COLOR_Format19bitARGB1666";
			break;
		case CodecCapabilities.COLOR_Format24BitABGR6666:
			name = "COLOR_Format24BitABGR6666";
			break;
		case CodecCapabilities.COLOR_Format24BitARGB6666:
			name = "COLOR_Format24BitARGB6666";
			break;
		case CodecCapabilities.COLOR_Format24bitARGB1887:
			name = "COLOR_Format24bitARGB1887";
			break;
		case CodecCapabilities.COLOR_Format24bitBGR888:
			name = "COLOR_Format24bitBGR888";
			break;
		case CodecCapabilities.COLOR_Format24bitRGB888:
			name = "COLOR_Format24bitRGB888";
			break;
		case CodecCapabilities.COLOR_Format25bitARGB1888:
			name = "COLOR_Format25bitARGB1888";
			break;
		case CodecCapabilities.COLOR_Format32bitARGB8888:
			name = "COLOR_Format32bitARGB8888";
			break;
		case CodecCapabilities.COLOR_Format32bitBGRA8888:
			name = "COLOR_Format32bitBGRA8888";
			break;
		case CodecCapabilities.COLOR_Format8bitRGB332:
			name = "COLOR_Format8bitRGB332";
			break;
		case CodecCapabilities.COLOR_FormatCbYCrY:
			name = "COLOR_FormatCbYCrY";
			break;
		case CodecCapabilities.COLOR_FormatCrYCbY:
			name = "COLOR_FormatCrYCbY";
			break;
		case CodecCapabilities.COLOR_FormatL16:
			name = "COLOR_FormatL16";
			break;
		case CodecCapabilities.COLOR_FormatL2:
			name = "COLOR_FormatL2";
			break;
		case CodecCapabilities.COLOR_FormatL24:
			name = "COLOR_FormatL24";
			break;
		case CodecCapabilities.COLOR_FormatL32:
			name = "COLOR_FormatL32";
			break;
		case CodecCapabilities.COLOR_FormatL4:
			name = "COLOR_FormatL4";
			break;
		case CodecCapabilities.COLOR_FormatL8:
			name = "COLOR_FormatL8";
			break;
		case CodecCapabilities.COLOR_FormatMonochrome:
			name = "COLOR_FormatMonochrome";
			break;
		case CodecCapabilities.COLOR_FormatRawBayer10bit:
			name = "COLOR_FormatRawBayer10bit";
			break;
		case CodecCapabilities.COLOR_FormatRawBayer8bit:
			name = "COLOR_FormatRawBayer8bit";
			break;
		case CodecCapabilities.COLOR_FormatRawBayer8bitcompressed:
			name = "COLOR_FormatRawBayer8bitcompressed";
			break;
		case CodecCapabilities.COLOR_FormatYCbYCr:
			name = "COLOR_FormatYCbYCr";
			break;
		case CodecCapabilities.COLOR_FormatYCrYCb:
			name = "COLOR_FormatYCrYCb";
			break;
		case CodecCapabilities.COLOR_FormatYUV411PackedPlanar:
			name = "COLOR_FormatYUV411PackedPlanar";
			break;
		case CodecCapabilities.COLOR_FormatYUV411Planar:
			name = "COLOR_FormatYUV411Planar";
			break;
		case CodecCapabilities.COLOR_FormatYUV420PackedPlanar:
			name = "COLOR_FormatYUV420PackedPlanar";
			break;
		case CodecCapabilities.COLOR_FormatYUV420PackedSemiPlanar:
			name = "COLOR_FormatYUV420PackedSemiPlanar";
			break;
		case CodecCapabilities.COLOR_FormatYUV420Planar:
			name = "COLOR_FormatYUV420Planar";
			break;
		case CodecCapabilities.COLOR_FormatYUV420SemiPlanar:
			name = "COLOR_FormatYUV420SemiPlanar";
			break;
		case CodecCapabilities.COLOR_FormatYUV422PackedPlanar:
			name = "COLOR_FormatYUV422PackedPlanar";
			break;
		case CodecCapabilities.COLOR_FormatYUV422PackedSemiPlanar:
			name = "COLOR_FormatYUV422PackedSemiPlanar";
			break;
		case CodecCapabilities.COLOR_FormatYUV422Planar:
			name = "COLOR_FormatYUV422Planar";
			break;
		case CodecCapabilities.COLOR_FormatYUV422SemiPlanar:
			name = "COLOR_FormatYUV422SemiPlanar";
			break;
		case CodecCapabilities.COLOR_FormatYUV444Interleaved:
			name = "COLOR_FormatYUV444Interleaved";
			break;
		case CodecCapabilities.COLOR_QCOM_FormatYUV420SemiPlanar:
			name = "COLOR_QCOM_FormatYUV420SemiPlanar";
			break;
		case CodecCapabilities.COLOR_TI_FormatYUV420PackedSemiPlanar:
			name = "COLOR_TI_FormatYUV420PackedSemiPlanar";
			break;
		case CodecCapabilities.COLOR_FormatSurface:
			name = "COLOR_FormatSurface";
			break;
		case CodecCapabilities.COLOR_FormatYUV420Flexible:
			name = "COLOR_FormatYUV420Flexible";
		default:
			name = "???";
		}
		name += "(" + format + ")";
		return name;
	}

	// https://github.com/MorihiroSoft/EffecTV_for_Android/blob/af6ccf722e412d3ea6ac2d78c30bf9437625dfdb/src/jp/effectv/android/DumpMediaCodec.java
	private static String avcProfileToString(int profile) {
		switch (profile) {
		case CodecProfileLevel.AVCProfileBaseline:
			return "AVCProfileBaseline";
		case CodecProfileLevel.AVCProfileExtended:
			return "AVCProfileExtended";
		case CodecProfileLevel.AVCProfileHigh:
			return "AVCProfileHigh";
		case CodecProfileLevel.AVCProfileHigh10:
			return "AVCProfileHigh10";
		case CodecProfileLevel.AVCProfileHigh422:
			return "AVCProfileHigh422";
		case CodecProfileLevel.AVCProfileHigh444:
			return "AVCProfileHigh444";
		case CodecProfileLevel.AVCProfileMain:
			return "AVCProfileMain";
		}
		return "unknown(avc:" + profile + ")";
	}

	private static String avcLevelToString(int level) {
		switch (level) {
		case CodecProfileLevel.AVCLevel1:
			return "AVCLevel1";
		case CodecProfileLevel.AVCLevel11:
			return "AVCLevel11";
		case CodecProfileLevel.AVCLevel12:
			return "AVCLevel12";
		case CodecProfileLevel.AVCLevel13:
			return "AVCLevel13";
		case CodecProfileLevel.AVCLevel1b:
			return "AVCLevel1b";
		case CodecProfileLevel.AVCLevel2:
			return "AVCLevel2";
		case CodecProfileLevel.AVCLevel21:
			return "AVCLevel21";
		case CodecProfileLevel.AVCLevel22:
			return "AVCLevel22";
		case CodecProfileLevel.AVCLevel3:
			return "AVCLevel3";
		case CodecProfileLevel.AVCLevel31:
			return "AVCLevel31";
		case CodecProfileLevel.AVCLevel32:
			return "AVCLevel32";
		case CodecProfileLevel.AVCLevel4:
			return "AVCLevel4";
		case CodecProfileLevel.AVCLevel41:
			return "AVCLevel41";
		case CodecProfileLevel.AVCLevel42:
			return "AVCLevel42";
		case CodecProfileLevel.AVCLevel5:
			return "AVCLevel5";
		case CodecProfileLevel.AVCLevel51:
			return "AVCLevel51";
		}
		return "unknown(avc:" + level + ")";
	}

	public static byte[] swapYV12toI420(byte[] yv12bytes, int width, int height) {
		byte[] i420bytes = new byte[yv12bytes.length];
		for (int i = 0; i < width * height; i++)
			i420bytes[i] = yv12bytes[i];
		for (int i = width * height; i < width * height
				+ (width / 2 * height / 2); i++)
			i420bytes[i] = yv12bytes[i + (width / 2 * height / 2)];
		for (int i = width * height + (width / 2 * height / 2); i < width
				* height + 2 * (width / 2 * height / 2); i++)
			i420bytes[i] = yv12bytes[i - (width / 2 * height / 2)];
		return i420bytes;
	}

	/** Prints the byte array in hex */
	public static void printByteArray(byte[] array, String tag) {
		StringBuilder sb = new StringBuilder();
		for (byte b : array) {
			sb.append(String.format("%02X ", b));
		}
		Log.i(TAG,tag + ":" + sb.toString());
	}

	public static void SaveFile_NV21(byte[] data, String name) {
		String DEBUG_FILE_NAME_BASE = Environment.getExternalStorageDirectory()
				+ "/000test/";
		String fileName = DEBUG_FILE_NAME_BASE + name;
		try {
			FileOutputStream outputStream = new FileOutputStream(fileName);
			outputStream.write(data);
			outputStream.close();
			Log.i(TAG,"SaveFile_NV21 " + fileName);
		} catch (IOException ioe) {
			Log.w(TAG,"SaveFile_NV21 Unable to create debug output file "
					+ fileName);
		}
	}

	public static void SaveFile_NV(byte[] data, String name) {
		String DEBUG_FILE_NAME_BASE = Environment.getExternalStorageDirectory()
				+ "/000test/";
		String fileName = DEBUG_FILE_NAME_BASE + name;
		try {
			FileOutputStream outputStream = new FileOutputStream(fileName);
			outputStream.write(data);
			outputStream.close();
			Log.i(TAG,"SaveFile_NV " + fileName);
		} catch (IOException ioe) {
			Log.w(TAG,"SaveFile_NV Unable to create debug output file " + fileName);
		}
	}

	// // 写文件在./data/data/com.tt/files/下面
	// public static void writeFileData(String fileName, String message) {
	// try {
	// FileOutputStream fout = openFileOutput(fileName, 0);//MODE_PRIVATE);
	// byte[] bytes = message.getBytes();
	// fout.write(bytes);
	// fout.close();
	// } catch (Exception e) {
	// e.printStackTrace();
	// }
	// }
	//
	// // 读文件在./data/data/com.tt/files/下面
	// public static String readFileData(String fileName) {
	// String res = "";
	// try {
	// FileInputStream fis = openFileInput(fileName);
	// int length = fis.available();
	// byte[] buffer = new byte[length];
	// //res = EncodingUtils.getString(buffer, "UTF-8");
	// fis.read(buffer);
	// fis.close();
	// }
	// catch (Exception e) {
	// e.printStackTrace();
	// }
	// return res;
	// }

	// https://github.com/google/ExoPlayer/blob/b3bf8fea20c1e82abef9a9a2699b3d7147672dd3/library/src/main/java/com/google/android/exoplayer/MediaCodecUtil.java
	/**
	 * @return the maximum frame size for an H264 stream that can be decoded on
	 *         the device.
	 */
	public static int maxH264DecodableFrameSize(String decoderName) {
		if (decoderName == null) {
			return 0;
		}

		int maxH264DecodableFrameSize = 0;
		int numCodecs = MediaCodecList.getCodecCount();
		for (int i = 0; i < numCodecs; i++) {
			MediaCodecInfo codecInfo = MediaCodecList.getCodecInfoAt(i);
			if (codecInfo.getName().equals(decoderName)) {
				try {
					CodecCapabilities capabilities = codecInfo
							.getCapabilitiesForType("video/avc");
					for (int j = 0; j < capabilities.profileLevels.length; j++) {
						CodecProfileLevel profileLevel = capabilities.profileLevels[j];
						maxH264DecodableFrameSize = Math.max(
								avcLevelToMaxFrameSize(profileLevel.level),
								maxH264DecodableFrameSize);
					}
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		}
		return maxH264DecodableFrameSize;
	}

	/**
	 * Conversion values taken from:
	 * https://en.wikipedia.org/wiki/H.264/MPEG-4_AVC.
	 * 
	 * @param avcLevel
	 *            one of CodecProfileLevel.AVCLevel* constants.
	 * @return maximum frame size that can be decoded by a decoder with the
	 *         specified avc level (or {@code -1} if the level is not
	 *         recognized)
	 */
	private static int avcLevelToMaxFrameSize(int avcLevel) {
		switch (avcLevel) {
		case CodecProfileLevel.AVCLevel1:
			return 25344;
		case CodecProfileLevel.AVCLevel1b:
			return 25344;
		case CodecProfileLevel.AVCLevel12:
			return 101376;
		case CodecProfileLevel.AVCLevel13:
			return 101376;
		case CodecProfileLevel.AVCLevel2:
			return 101376;
		case CodecProfileLevel.AVCLevel21:
			return 202752;
		case CodecProfileLevel.AVCLevel22:
			return 414720;
		case CodecProfileLevel.AVCLevel3:
			return 414720;
		case CodecProfileLevel.AVCLevel31:
			return 921600;
		case CodecProfileLevel.AVCLevel32:
			return 1310720;
		case CodecProfileLevel.AVCLevel4:
			return 2097152;
		case CodecProfileLevel.AVCLevel41:
			return 2097152;
		case CodecProfileLevel.AVCLevel42:
			return 2228224;
		case CodecProfileLevel.AVCLevel5:
			return 5652480;
		case CodecProfileLevel.AVCLevel51:
			return 9437184;
		default:
			return -1;
		}
	}
}
