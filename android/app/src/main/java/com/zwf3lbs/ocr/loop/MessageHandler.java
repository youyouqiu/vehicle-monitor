// Decompiled by Jad v1.5.8e. Copyright 2001 Pavel Kouznetsov.
// Jad home page: http://www.geocities.com/kpdus/jad.html
// Decompiler options: braces fieldsfirst space lnc 

package com.zwf3lbs.ocr.loop;

import android.os.Handler;
import android.os.Message;

// Referenced classes of package com.qingchifan.view:
//            LoopView

final class MessageHandler extends Handler {

    final LoopView loopView;

    MessageHandler(LoopView loopview) {
        super();
        loopView = loopview;
    }

    public final void handleMessage(Message paramMessage) {
        if (paramMessage.what == 1000) {
            this.loopView.invalidate();
        }
        if (paramMessage.what == 2000) {
            LoopView.b(loopView);
        } else if (paramMessage.what == 3000) {
            this.loopView.c();
        }
        super.handleMessage(paramMessage);
    }

}
