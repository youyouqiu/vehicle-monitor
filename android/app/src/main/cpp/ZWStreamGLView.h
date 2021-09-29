//
// Created by Administrator on 2018/8/15.
//

#ifndef ZWSTREAMGLVIEW_H
#define ZWSTREAMGLVIEW_H

#include "CommonPublic.h"

#define FILL_MODE_Stretch                       0
#define FILL_MODE_PreserveAspectRatio           1
#define FILL_MODE_PreserveAspectRatioAndFill    2

#ifndef MIN
#define MIN(a,b) ((a)<=(b)?(a):(b))
#endif

#ifndef MAX
#define MAX(a,b) ((a)>=(b)?(a):(b))
#endif

class ZWStreamGLView {
private:
    EGLContext _lastContext = nullptr;
    EGLDisplay _lastDisplay = nullptr;
    EGLSurface _lastSurfaceD = nullptr;
    EGLSurface _lastSurfaceR = nullptr;

    void recoveryCurrent();
    bool makeCurrent();
    void saveCurrent();
public:
    ~ZWStreamGLView();
    void draw(const uint8_t* data, int imageWidth, int imageHeight);

    static ZWStreamGLView* create(ANativeWindow *window, int width, int height, int fillMode=FILL_MODE_PreserveAspectRatio) {
        ZWStreamGLView* openGLView = new ZWStreamGLView();
        openGLView->_fillMode = fillMode;
        if(openGLView->contextInit(window)==0){
            openGLView->makeCurrent();
            if (openGLView->programInit()==0) {
                openGLView->vaoInit();
                openGLView->setWindowsSize(width, height);
                return openGLView;
            }
            openGLView->recoveryCurrent();
        }
        LOGE("ZWStreamGLView - init failed.");
        return nullptr;
    }

    inline void setProgram(int index) {
        if(index != _colorIndex) {
            _colorIndex = index;
            _currentProgram = _colorIndex == 1 ? _program1 : _program2;
//            glUseProgram(_currentProgram);
        }
    }

    inline void setWindowsSize(int width, int height) {
        if (_viewWidth == width && _viewHeight == height) {
            return;
        }
        _viewWidth = width;
        _viewHeight = height;
//        glViewport(0, 0, _viewWidth, _viewHeight);

        if (_fillMode != FILL_MODE_Stretch){
//            updateVbo();
        }
    }

private:
    GLuint _vboIDs[3];
    GLuint _vaoID = 0;

    GLuint _program1 = 0;
    GLuint _program2 = 0;
    GLuint _currentProgram = 0;

    GLuint _textureY = 0;
    GLuint _textureU = 0;
    GLuint _textureV = 0;

    GLint _samplerLocY1 = 0;
    GLint _samplerLocU1 = 0;
    GLint _samplerLocY2 = 0;
    GLint _samplerLocU2 = 0;
    GLint _samplerLocV2 = 0;

    EGLSurface _eglSurface = nullptr;
    EGLDisplay _display = nullptr;
    EGLContext _eglContext = nullptr;

    EGLint _viewWidth = -1;
    EGLint _viewHeight = -1;
    int _imageWidth = -1;
    int _imageHeight = -1;

    int _colorIndex = -1;

    int _fillMode = 0;

    ZWStreamGLView() = default;

    int contextInit(ANativeWindow *window);
    int programInit();
    void vaoInit();
    void updateVbo();

    static const GLushort indices[6];
    static const GLfloat drawSize[8];
    static GLfloat pointCrood[8];

    static const char* vertShaderSrc;
    static const char* nv21FragShaderSrc;
    static const char* yuv420pFragShaderSrc;

    static GLuint esLoadShader(GLenum type, const char* shaderSrc);
    static GLuint esLoadProgram(const char* vertShaderSrc, const char* fragShaderSrc);
};

#endif
