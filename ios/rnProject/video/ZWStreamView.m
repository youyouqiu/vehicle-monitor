//
//  ZWStreamView.mm
//  MetalYUV420P
//
//  Created by 改革丰富 on 2017/3/7.
//  Copyright © 2017年 改革丰富. All rights reserved.
//

#import "ZWStreamView.h"
#import <Metal/Metal.h>
#import <MetalKit/MetalKit.h>
#import <SceneKit/SceneKit.h>

static id<MTLDevice> device;
static id<MTLCommandQueue> commandQueue;
static id<MTLLibrary> library;
static id<MTLFunction> vertexFunction;
static id<MTLFunction> fragmentFunctionNV12;
static id<MTLFunction> fragmentFunctionRGBA;
static id<MTLRenderPipelineState> renderStateHard;
static id<MTLSamplerState> sampler;

static float32_t vertexData[16] = {0.0, 0.0, -1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 0.0, 1.0, -1.0, -1.0};
static int32_t indices[6] = {0, 1, 2, 0, 2, 3};
static float yuvFormulaData[12] = {1.0, 1.0, 1.0, 0.0, 0.0, -0.58060, 1.13983, 0.0, 2.03211, -0.39465, 0.0, 0.0};

static id<MTLBuffer> indexBuffer;
static id<MTLBuffer> vertexBuffer;
static id<MTLBuffer> yuvFormulaBuffer;

@interface ZWStreamView()
{
    CVMetalTextureRef yTextureRef;
    CVMetalTextureRef uvTextureRef;
    CVMetalTextureCacheRef metalTextureCache;

    id<MTLTexture> _yTexture;
    id<MTLTexture> _uvTexture;
    __weak CAMetalLayer* _metalLayer;
    
    SCNView* _scnView;
    SCNNode* _geometryNode;
    SCNGeometry* _geometry;
    SCNNode* _cameraNode;
    SCNCamera* _camera;
    
    bool _is360;
}

@end

@implementation ZWStreamView

+ (Class)layerClass
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        device = MTLCreateSystemDefaultDevice();
        commandQueue = [device newCommandQueue];
        library = [device newDefaultLibrary];
        vertexFunction = [library newFunctionWithName:@"texture_vertex"];
        fragmentFunctionNV12 = [library newFunctionWithName:@"texture_fragmentNV12"];
        fragmentFunctionRGBA = [library newFunctionWithName:@"texture_fragmentRGB"];

        MTLRenderPipelineDescriptor* renderPipelineDescriptor = [[MTLRenderPipelineDescriptor alloc] init];
        renderPipelineDescriptor.vertexFunction = vertexFunction;
        renderPipelineDescriptor.colorAttachments[0].pixelFormat = MTLPixelFormatBGRA8Unorm;

        NSError *errors = nil;
        renderPipelineDescriptor.fragmentFunction = fragmentFunctionRGBA;//fragmentFunctionNV12;
        renderStateHard = [device newRenderPipelineStateWithDescriptor:renderPipelineDescriptor error:&errors];
        assert(renderStateHard && !errors);

        MTLSamplerDescriptor* samplerDescriptor = [[MTLSamplerDescriptor alloc] init];
        samplerDescriptor.minFilter = MTLSamplerMinMagFilterLinear;
        samplerDescriptor.magFilter = MTLSamplerMinMagFilterLinear;
        samplerDescriptor.tAddressMode = MTLSamplerAddressModeRepeat;
        samplerDescriptor.sAddressMode = MTLSamplerAddressModeRepeat;

        sampler = [device newSamplerStateWithDescriptor:samplerDescriptor];
        indexBuffer = [device newBufferWithBytes:indices length:6 * 4 options:MTLResourceOptionCPUCacheModeDefault];
        vertexBuffer = [device newBufferWithBytes:vertexData length:16 * 4 options:MTLResourceOptionCPUCacheModeDefault];
        yuvFormulaBuffer = [device newBufferWithBytes:yuvFormulaData length:12 * 4 options:MTLResourceOptionCPUCacheModeDefault];
    });
    return [CAMetalLayer class];
}

-(void)setupSCN{
    // 初始化scene
    _scnView = [[SCNView alloc] initWithFrame:self.bounds];
    _scnView.scene = [SCNScene scene];
    [_scnView setPlaying:true];
    [self addSubview:_scnView];

    // 相机
    _camera = [SCNCamera camera];
//    _camera.usesOrthographicProjection = true;
//    _camera.orthographicScale = 50;
    _camera.automaticallyAdjustsZRange = true;
    _cameraNode = [SCNNode node];
    _cameraNode.camera = _camera;
    _cameraNode.position = SCNVector3Make(0, 0, 0); // 位置（屏幕中心）
    [_scnView.scene.rootNode addChildNode:_cameraNode];
    
    SCNVector3 projectedOrigin = [_scnView projectPoint:SCNVector3Zero];
    SCNVector3 vpWithZ1 = SCNVector3Make(0, 0, projectedOrigin.z);
    SCNVector3 vpWithZ2 = SCNVector3Make(_scnView.frame.size.width, _scnView.frame.size.height, projectedOrigin.z);
    SCNVector3 worldPoint1 = [_scnView unprojectPoint:vpWithZ1];
    SCNVector3 worldPoint2 = [_scnView unprojectPoint:vpWithZ2];
//    NSLog(@"worldPoint1=%f,%f,%f worldPoint2=%f,%f,%f",worldPoint1.x,worldPoint1.y,worldPoint1.z,worldPoint2.x,worldPoint2.y,worldPoint2.z);
    float width = fabsf(worldPoint2.x - worldPoint1.x);
    float height = fabsf(worldPoint2.y - worldPoint1.y);
//    NSLog(@"size=%f,%f frame=%f,%f",width,height,_scnView.frame.size.width,_scnView.frame.size.height);
//    SCNPlane* plane2 = [SCNPlane planeWithWidth:_scnView.frame.size.width height:_scnView.frame.size.height];
//    _geometry = plane2;
//    _geometryNode.geometry = _geometry;
    
    _scnView.allowsCameraControl = true;
//    NSLog(@"image:%@ _scnView=%@",image,_scnView);
    
    if (_is360) {
        // 绘制球体
        SCNSphere * sphere = [SCNSphere sphereWithRadius: 100];

    //    _sphere.firstMaterial.cullMode = SCNCullModeFront;
        _geometry = sphere;
    //    [_geometryNode addChildNode:lightNode];
    } else {
        SCNPlane* plane = [SCNPlane planeWithWidth:width height:height];
        _geometry = plane;
    }
    UIImage* image = [UIImage imageNamed:@"360Photos.jpg"];
    _geometry.firstMaterial.diffuse.contents = image;
    _geometry.firstMaterial.diffuse.contentsTransform = SCNMatrix4Translate(SCNMatrix4MakeScale(-1, 1, 1), 1, 0, 0);//SCNMatrix4MakeRotation(90,0,1,0); //
    _geometry.firstMaterial.doubleSided = true;
    _geometryNode = [SCNNode node]; // 节点
    _geometryNode.geometry = _geometry;
    _geometryNode.position = SCNVector3Make(0, 0, 0); // 位置（屏幕中心）
    [_scnView.scene.rootNode addChildNode:_geometryNode]; // 添加至场景根节点
    
}

-(instancetype)initWithFrame:(CGRect)frameRect
{
    self = [super initWithFrame:frameRect];
    if(self)
    {
        _is360 = false;
        if (_is360) {
            [self setupSCN];
            device = _scnView.device;//MTLCreateSystemDefaultDevice();
        } else {
            device = MTLCreateSystemDefaultDevice();
        }
        _metalLayer = (CAMetalLayer *)self.layer;
        _metalLayer.frame = self.layer.frame;
//      _metalLayer.backgroundColor = (__bridge CGColorRef _Nullable)([UIColor redColor]);
        _metalLayer.device = device;
        _metalLayer.framebufferOnly = YES;
        _metalLayer.presentsWithTransaction = NO;
//
        yTextureRef = NULL;
        uvTextureRef = NULL;
        CVMetalTextureCacheCreate(kCFAllocatorDefault, NULL, device, NULL, &metalTextureCache);
        CVMetalTextureCacheFlush(metalTextureCache, 0);
        
    }
    return self;
}

-(void)setFrame:(CGRect)frame
{
    [super setFrame:frame];
    _metalLayer.frame = self.layer.bounds;
}

// https://blog.csdn.net/weixin_33797791/article/details/88017482
-(void)metalDraw:(CVPixelBufferRef)pixelBuffer
{
    if(CVMetalTextureCacheCreateTextureFromImage(kCFAllocatorDefault, metalTextureCache, pixelBuffer,
       NULL, MTLPixelFormatBGRA8Unorm, _textureSize.width, _textureSize.height, 0, &yTextureRef))
    {
        NSLog(@"metalDraw err texture");
        return;
    }
    _yTexture = CVMetalTextureGetTexture(yTextureRef);
    if (_is360) {
        _geometry.firstMaterial.diffuse.contents = _yTexture;
        return;
    }
    id<MTLCommandBuffer> commandBuffer = [commandQueue commandBuffer];

    id<CAMetalDrawable> drawable = [_metalLayer nextDrawable];
    MTLRenderPassDescriptor* passDescriptor = [MTLRenderPassDescriptor renderPassDescriptor];
    passDescriptor.colorAttachments[0].texture = drawable.texture;
    id <MTLRenderCommandEncoder> commandEncoder = [commandBuffer renderCommandEncoderWithDescriptor:passDescriptor];

    [commandEncoder setRenderPipelineState:renderStateHard];

    [commandEncoder setVertexBuffer:vertexBuffer offset:0 atIndex:0];
    [commandEncoder setFragmentSamplerState:sampler atIndex:0];

    [commandEncoder setFragmentTexture:_yTexture atIndex:0];
//    [commandEncoder setFragmentTexture:_uvTexture atIndex:1];

//    [commandEncoder setFragmentBuffer:yuvFormulaBuffer offset:0 atIndex:0];

    [commandEncoder drawIndexedPrimitives:MTLPrimitiveTypeTriangle indexCount:6 indexType:MTLIndexTypeUInt32 indexBuffer:indexBuffer indexBufferOffset:0];

    [commandEncoder endEncoding];
    [commandBuffer presentDrawable:drawable];
  
    [commandBuffer commit];
}

-(void)draw:(CVPixelBufferRef)pixelBuffer
{
    size_t width = CVPixelBufferGetWidth(pixelBuffer);
    size_t height = CVPixelBufferGetHeight(pixelBuffer);
    if(width > 0 && height > 0)
    {
        if(_textureSize.width != width || _textureSize.height != height)
        {
            _textureSize = CGSizeMake(width, height);
            _metalLayer.drawableSize = _textureSize;
        }
        @autoreleasepool
        {
            [self metalDraw: pixelBuffer];
            if(yTextureRef)
            {
                CFRelease(yTextureRef);
                yTextureRef = NULL;
            }
            if(uvTextureRef)
            {
                CFRelease(uvTextureRef);
                uvTextureRef = NULL;
            }
            CVMetalTextureCacheFlush(metalTextureCache, 0);
        }
    }
}

@end
