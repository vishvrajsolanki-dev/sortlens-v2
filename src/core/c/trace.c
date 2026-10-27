// trace.c - Array-based queue for event tracing (Practical 5)
// Records step-by-step sorting actions for exact frontend replay.
#include "sortlens.h"

// Initialize the trace queue
void trace_init(TraceQueue *q, int recording) {
    q->front = 0;
    q->rear = 0;
    q->count = 0;
    q->overflow = 0;
    q->recording = recording;
}

// Enqueue an event if recording is on and space remains
void trace_add(TraceQueue *q, int type, int a, int b, int c, int d) {
    if (!q->recording) {
        return;
    }
    if (q->count >= MAX_EVENTS) {
        q->overflow = 1;
        return;
    }
    q->events[q->rear].type = type;
    q->events[q->rear].a = a;
    q->events[q->rear].b = b;
    q->events[q->rear].c = c;
    q->events[q->rear].d = d;
    q->rear++;
    q->count++;
}
