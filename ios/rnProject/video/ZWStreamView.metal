//
//  ZWStreamView.metal
//  MetalYUV420P
//
//  Created by 改革丰富 on 2017/3/13.
//  Copyright © 2017年 改革丰富. All rights reserved.
//

#include <metal_stdlib>
using namespace metal;

struct VertexIn
{
    float2 st;
    float2 position;
};

struct VertexOut
{
    float2 st;
    float4 position [[position]];
};

vertex VertexOut texture_vertex(const uint vid[[vertex_id]], const device VertexIn* buffer[[buffer(0)]])
{
    VertexOut outVertex;
    outVertex.st = buffer[vid].st;
    outVertex.position = float4(buffer[vid].position.xy, 0.0, 1.0);
    return outVertex;
};

fragment float4 texture_fragmentYUV420P(VertexOut inVertext[[stage_in]], texture2d<float> textureY[[texture(0)]], texture2d<float> textureU[[texture(1)]], texture2d<float> textureV[[texture(2)]], const device float3x3* yuvFormulaData[[buffer(0)]], sampler defaultSampler[[sampler(0)]])
{
    float3 yuv;
    yuv.x = textureY.sample(defaultSampler, inVertext.st).r;
    yuv.y = textureU.sample(defaultSampler, inVertext.st).r - 0.5;
    yuv.z = textureV.sample(defaultSampler, inVertext.st).r - 0.5;
    float3 rgbColor = (*yuvFormulaData) * yuv;
    return float4(rgbColor, 1.0);
}

fragment float4 texture_fragmentNV12(VertexOut inVertext[[stage_in]], texture2d<float> textureY[[texture(0)]], texture2d<float> textureU[[texture(1)]], const device float3x3* yuvFormulaData[[buffer(0)]], sampler defaultSampler[[sampler(0)]])
{
    float3 yuv;
    yuv.x = textureY.sample(defaultSampler, inVertext.st).r;
    yuv.yz = textureU.sample(defaultSampler, inVertext.st).rg - float2(0.5, 0.5);
    float3 rgbColor = (*yuvFormulaData) * yuv;
    return float4(rgbColor, 1.0);
}


fragment float4 texture_fragmentRGB(VertexOut inVertext[[stage_in]], texture2d<float> texture[[texture(0)]], sampler defaultSampler[[sampler(0)]])
{
    float3 rgbColor = texture.sample(defaultSampler, inVertext.st).rgb;
    return float4(rgbColor, 1.0);
}

typedef struct
{
    float4 clipSpacePosition [[position]]; // position的修饰符表示这个是顶点
    
    float2 textureCoordinate; // 纹理坐标，会做插值处理
    
} RasterizerData;

