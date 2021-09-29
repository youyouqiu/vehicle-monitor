#include "AdpcmCoder.h"

static int indexTable[16] = {
        -1, -1, -1, -1, 2, 4, 6, 8,
        -1, -1, -1, -1, 2, 4, 6, 8,
};

static int stepSizeTable[89] = {
        7, 8, 9, 10, 11, 12, 13, 14, 16, 17,
        19, 21, 23, 25, 28, 31, 34, 37, 41, 45,
        50, 55, 60, 66, 73, 80, 88, 97, 107, 118,
        130, 143, 157, 173, 190, 209, 230, 253, 279, 307,
        337, 371, 408, 449, 494, 544, 598, 658, 724, 796,
        876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066,
        2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358,
        5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
        15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767
};

void adpcm_decode(char* inData, short* outData, int len, adpcm_state *state) {
    char * in = inData; // input buffer pointer
    short* out = outData; // output buffer pointer
    int valPrev = state->valPrev; // predicted output value
    int index = state->index; // current step change index
    int step = stepSizeTable[index]; // step size
    int bufferStep = 0; // toggle between output buffer / output
    int sign = 0; // current adpcm sign bit
    int delta = 0; // current adpcm output value
    int inputBuffer = 0; // place to keep next 4-bit value
    int vpDiff = 0; // current change to valPrev

    for ( ; len > 0 ; --len)
    {
        // Step 1 - get the delta value
        if(bufferStep)
        {
            delta = inputBuffer & 0xf;
        }
        else
        {
            inputBuffer = *in++;
            delta = (inputBuffer >> 4) & 0xf;
        }
        bufferStep = !bufferStep;

        // Step 2 - find new index value (for later)
        index += indexTable[delta];
        if(index < 0)
        {
            index = 0;
        }
        if(index > 88)
        {
            index = 88;
        }

        // Step 3 - separate sign and magnitude
        sign = delta & 8;
        delta = delta & 7;

        // Combined steps 4 and 5
        // Step 4 - compute difference and new predicted value
        // Step 5 - clamp output value
        // Compute 'vpDiff = (delta + 0.5) * step / 4
        vpDiff = step >> 3;
        if(delta & 4)
        {
            vpDiff += step;
        }
        if(delta & 2)
        {
            vpDiff += step >> 1;
        }
        if(delta & 1)
        {
            vpDiff += step >> 2;
        }
        if(sign)
        {
            valPrev -= vpDiff;
        }
        else
        {
            valPrev += vpDiff;
        }
        // check for overflow
        if(valPrev > 32767)
        {
            valPrev = 32767;
        }
        else if(valPrev < -32768)
        {
            valPrev = -32768;
        }

        // Step 6 - update step value
        step = stepSizeTable[index];

        // Step 7 - output value
        *out++ = static_cast<short>(valPrev);
    }
    state->valPrev = static_cast<short>(valPrev);
    state->index = static_cast<char>(index);
}

