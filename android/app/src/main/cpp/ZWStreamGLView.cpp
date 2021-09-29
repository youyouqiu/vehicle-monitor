//
// Created by Administrator on 2018/8/15.
//

#include "ZWStreamGLView.h"

const GLushort ZWStreamGLView::indices[6] =  { 0, 1, 2, 0, 2, 3 };
const GLfloat ZWStreamGLView::drawSize[8] = {0.0, 0.0,
                                             1.0, 0.0,
                                             1.0, 1.0,
                                             0.0, 1.0};

GLfloat ZWStreamGLView::pointCrood[8] = {-1.0, 1.0,
                                                      1.0, 1.0,
                                                      1.0, -1.0,
                                                      -1.0, -1.0};
//const GLfloat ZWStreamGLView::drawSize[8] = {0.0, 0.0,
//                                             1.0, 0.0,
//                                             0.0, 1.0,
//                                             1.0, 1.0};
//const GLfloat ZWStreamGLView::pointCrood[8] = {-1.0, -1.0,
//                                               1.0, -1.0,
//                                               -1.0, 1.0,
//                                               1.0, 1.0};

const char* ZWStreamGLView::vertShaderSrc =
#include"VertexShader.string"

const char* ZWStreamGLView::nv21FragShaderSrc =
#include"NV21FragmentShader.string"

const char* ZWStreamGLView::yuv420pFragShaderSrc =
#include"YUV420PFragmentShader.string"

void ZWStreamGLView::saveCurrent() {
    _lastSurfaceD = eglGetCurrentSurface(EGL_DRAW);
    _lastSurfaceR = eglGetCurrentSurface(EGL_READ);
    _lastDisplay = eglGetCurrentDisplay();
    _lastContext = eglGetCurrentContext();
}
void ZWStreamGLView::recoveryCurrent(){
    if (_lastContext != nullptr) {
        eglMakeCurrent(_lastDisplay, _lastSurfaceD, _lastSurfaceR,
                       _lastContext);
        _lastContext = nullptr;
        _lastDisplay = nullptr;
        _lastSurfaceD = nullptr;
        _lastSurfaceR = nullptr;
    }
}
bool ZWStreamGLView::makeCurrent() {
    if (_display == EGL_NO_DISPLAY) {
        // called makeCurrent() before create?
        LOGE("NOTE: makeCurrent w/o display");
        return false;
    } else {
        saveCurrent();
        if (!eglMakeCurrent(_display, _eglSurface, _eglSurface, _eglContext)) {
            LOGE("eglMakeCurrent failed");
            return false;
        }
    }
    return true;
}

GLuint ZWStreamGLView::esLoadShader(GLenum type, const char* shaderSrc)
{
    GLuint shader;
    GLint compiled;
    shader = glCreateShader(type);
    
    if(shader == 0)
    {
        return 0;
    }

    glShaderSource(shader, 1, &shaderSrc, nullptr);
    glCompileShader(shader);
    glGetShaderiv(shader, GL_COMPILE_STATUS, &compiled);
    
    if(!compiled)
    {
        GLint infoLen = 0;
        glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &infoLen);
        glDeleteShader(shader);
        return 0;
    }
    return shader;
}

GLuint ZWStreamGLView::esLoadProgram(const char* vertShaderSrc, const char* fragShaderSrc)
{
    GLuint vertexShader;
    GLuint fragmentShader;
    GLuint programObject;
    GLint linked;
    
    vertexShader = esLoadShader(GL_VERTEX_SHADER, vertShaderSrc);
    if(vertexShader == 0)
    {
        return 0;
    }

    fragmentShader = esLoadShader(GL_FRAGMENT_SHADER, fragShaderSrc);
    if(fragmentShader == 0)
    {
        return 0;
    }

    programObject = glCreateProgram();
    
    if(programObject == 0)
    {
        return 0;
    }

    glAttachShader(programObject, vertexShader);
    glAttachShader(programObject, fragmentShader);
    glLinkProgram(programObject);
    glGetProgramiv(programObject, GL_LINK_STATUS, &linked);
    
    if(!linked)
    {
        GLint infoLen = 0;
        glGetProgramiv(programObject, GL_INFO_LOG_LENGTH, &infoLen);
        glDeleteProgram(programObject);
        return 0;
    }
    
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);
    
    return programObject;
}

int ZWStreamGLView::programInit()
{
    _program1 = esLoadProgram(vertShaderSrc, nv21FragShaderSrc);
    _program2 = esLoadProgram(vertShaderSrc, yuv420pFragShaderSrc);
    
    if(_program1 == 0 || _program2 == 0)
    {
        return -1;
    }

    glGenTextures(1, &_textureY);
    glBindTexture(GL_TEXTURE_2D, _textureY);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

    glGenTextures(1, &_textureU);
    glBindTexture(GL_TEXTURE_2D, _textureU);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

    glGenTextures(1, &_textureV);
    glBindTexture(GL_TEXTURE_2D, _textureV);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

    _samplerLocY1 = glGetUniformLocation(_program1, "y_texture");
    _samplerLocU1 = glGetUniformLocation(_program1, "u_texture");

    _samplerLocY2 = glGetUniformLocation(_program2, "y_texture");
    _samplerLocU2 = glGetUniformLocation(_program2, "u_texture");
    _samplerLocV2 = glGetUniformLocation(_program2, "v_texture");
    return 0; 
}

void ZWStreamGLView::updateVbo()
{
    return;
    float w,h;
    if (_fillMode == FILL_MODE_Stretch){
        w = 1.0;
        h = 1.0;
    }else{
        bool fit = (_fillMode == FILL_MODE_PreserveAspectRatio);
        float width = _imageWidth;
        float height = _imageHeight;
        float dH = (float)_viewHeight / height;
        float dW = (float)_viewWidth / width;
        float dd = fit ? MIN(dH, dW) : MAX(dH, dW);
        h = (height * dd / (float)_viewHeight);
        w = (width  * dd / (float)_viewWidth );
    }
    pointCrood[0] = - w;
    pointCrood[1] =   h;

    pointCrood[2] =   w;
    pointCrood[3] =   h;

    pointCrood[4] =   w;
    pointCrood[5] = - h;

    pointCrood[6] = - w;
    pointCrood[7] = - h;

    glBindBuffer(GL_ARRAY_BUFFER, _vboIDs[0]);
    glBufferData(GL_ARRAY_BUFFER, sizeof(pointCrood), pointCrood, GL_STATIC_DRAW);
}

void ZWStreamGLView::vaoInit()
{
    glGenBuffers(3, _vboIDs);
    
    glBindBuffer(GL_ARRAY_BUFFER, _vboIDs[0]);
    glBufferData(GL_ARRAY_BUFFER, sizeof(pointCrood), pointCrood, GL_DYNAMIC_DRAW);
    
    glBindBuffer(GL_ARRAY_BUFFER, _vboIDs[1]);
    glBufferData(GL_ARRAY_BUFFER, sizeof(drawSize), drawSize, GL_DYNAMIC_DRAW);
    
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, _vboIDs[2]);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof ( indices ), indices, GL_STATIC_DRAW);
    
    glGenVertexArrays(1, &_vaoID);
    glBindVertexArray(_vaoID);
    
    glEnableVertexAttribArray(0);
    glEnableVertexAttribArray(1);
    
    glBindBuffer(GL_ARRAY_BUFFER, _vboIDs[0]); // vertex buffer
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2*sizeof(GLfloat), nullptr);
    glBindBuffer(GL_ARRAY_BUFFER, _vboIDs[1]); // texture buffer
    glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 2*sizeof(GLfloat), nullptr);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, _vboIDs[2]); // vertex index buffer, to reuse vertex array
}

int ZWStreamGLView::contextInit(ANativeWindow *nativeWindow)
{
    _display = eglGetDisplay(EGL_DEFAULT_DISPLAY);
    if(_display == EGL_NO_DISPLAY)
    {
        return -1;
    }

    GLint majorVersion = -1;
    GLint minorVersion = -1;
    if(!eglInitialize(_display, &majorVersion, &minorVersion))
    {
        return -1;
    }
    
    EGLint config_attribs[] =
    {
        EGL_BLUE_SIZE, 8,
        EGL_GREEN_SIZE, 8,
        EGL_RED_SIZE, 8,
        EGL_DEPTH_SIZE, 24,
        EGL_RENDERABLE_TYPE, EGL_OPENGL_ES3_BIT_KHR,
        EGL_SURFACE_TYPE, EGL_WINDOW_BIT,
        EGL_NONE
    };
    
    int num_configs = 0;
    EGLConfig eglConfig;
    
    if(!eglChooseConfig(_display, config_attribs, &eglConfig, 1, &num_configs))
    {
        return -1;
    }

    EGLint format = 0;
    eglGetConfigAttrib(_display, eglConfig, EGL_NATIVE_VISUAL_ID, &format);
    
    ANativeWindow_setBuffersGeometry(nativeWindow, 0, 0, format);
    
    _eglSurface = eglCreateWindowSurface(_display, eglConfig, nativeWindow, nullptr);
    
    if(_eglSurface == EGL_NO_SURFACE)
    {
        return -1;
    }
    
    EGLint context_attrib[] =
    {
        EGL_CONTEXT_CLIENT_VERSION, 3,
        EGL_NONE
    };
    
    _eglContext = eglCreateContext(_display, eglConfig, EGL_NO_CONTEXT, context_attrib);
    
    if(_eglContext == EGL_NO_CONTEXT)
    {
        return -1;
    }

    if (!makeCurrent()) {
        return -1;
    }
//
//    if(!eglMakeCurrent(_display, _eglSurface, _eglSurface, _eglContext))
//    {
//        return -1;
//    }

//    if(!eglQuerySurface(_display, _eglSurface, EGL_WIDTH, &_viewWidth) || !eglQuerySurface(_display, _eglSurface, EGL_HEIGHT, &_viewHeight))
//    {
//        return -1;
//    }

//    glViewport(0, 0, _viewWidth, _viewHeight);
    //glClearColor(1.0, 0.0, 0.0, 1.0);
//    glDisable(GL_CULL_FACE);

//    setProgram(0);
    
    return 0;
}

void ZWStreamGLView::draw(const uint8_t* data, int imageWidth, int imageHeight)
{

    makeCurrent();
    if (_imageWidth!=imageWidth || _imageHeight!=imageHeight){
        _imageWidth = imageWidth;
        _imageHeight = imageHeight;
    }
    if (_viewWidth<=0||_viewHeight<=0){
        if(!eglQuerySurface(_display, _eglSurface, EGL_WIDTH, &_viewWidth) || !eglQuerySurface(_display, _eglSurface, EGL_HEIGHT, &_viewHeight))
        {
            LOGE("NOTE: eglQuerySurface");
            return;
        }
    }

    if (_fillMode != FILL_MODE_Stretch){
        updateVbo();
    }
    glViewport(0, 0, _viewWidth, _viewHeight);
    glUseProgram(_currentProgram);

    int uOffSet = imageWidth * imageHeight;
    GLint samplerLocY = _currentProgram == _program1 ? _samplerLocY1 : _samplerLocY2;

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, _textureY);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_R8, (GLsizei) imageWidth, (GLsizei) imageHeight, 0,
                 GL_RED, GL_UNSIGNED_BYTE, data);
    glUniform1i(samplerLocY, 0);

    if(_currentProgram == _program1)
    {
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, _textureU);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RG8, (GLsizei) imageWidth / 2, (GLsizei) imageHeight / 2,
                     0, GL_RG, GL_UNSIGNED_BYTE, data + uOffSet);
        glUniform1i(_samplerLocU1, 1);
    }
    else if(_currentProgram == _program2)
    {
        int vOffSet = uOffSet + imageWidth * imageHeight / 4;
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, _textureU);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_R8, (GLsizei) imageWidth / 2, (GLsizei) imageHeight / 2,
                     0, GL_RED, GL_UNSIGNED_BYTE, data + uOffSet);
        glUniform1i(_samplerLocU2, 1);
        
        glActiveTexture(GL_TEXTURE2);
        glBindTexture(GL_TEXTURE_2D, _textureV);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_R8, (GLsizei) imageWidth / 2, (GLsizei) imageHeight / 2,
                     0, GL_RED, GL_UNSIGNED_BYTE, data + vOffSet);
        glUniform1i(_samplerLocV2, 2);
    }
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_SHORT, nullptr); // draw 2 triangles, so use 6 vertexes
    eglSwapBuffers(_display, _eglSurface);

    recoveryCurrent();
}

ZWStreamGLView::~ZWStreamGLView()
{    
    if(_display && _eglContext)
    {
        eglDestroyContext(_display, _eglContext);
    }
    if(_display && _eglSurface)
    {
        eglDestroySurface(_display, _eglSurface);
    }
    if(_display)
    {
        eglTerminate(_display);
    }
    if(_vaoID)
    {
        glDeleteBuffers(3, _vboIDs);
        glDeleteVertexArrays(1, &_vaoID);
    }
    if(_program1 && _program2)
    {
        glDeleteTextures(1, &_textureY);
        glDeleteTextures(1, &_textureU);
        glDeleteTextures(1, &_textureV);
    }
    if(_program1)
    {
        glDeleteProgram(_program1);
    }
    if(_program2)
    {
        glDeleteProgram(_program2);
    }
}
