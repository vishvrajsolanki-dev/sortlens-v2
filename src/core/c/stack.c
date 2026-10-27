// stack.c - Array-based stack for recursion depth (Practical 3)
// Tracks Quick Sort and Merge Sort call tree depth.
#include "sortlens.h"

// Initialize stack with empty state
void stack_init(CallStack *s) {
    s->top = -1;
    s->max_depth = 0;
}

// Push recursion range onto stack and track high-water mark
void stack_push(CallStack *s, int low, int high) {
    if (s->top + 2 < MAX_ARRAY_SIZE * 2) {
        s->top++;
        s->data[s->top] = low;
        s->top++;
        s->data[s->top] = high;
        
        int current_depth = (s->top + 1) / 2;
        if (current_depth > s->max_depth) {
            s->max_depth = current_depth;
        }
    }
}

// Pop one frame (low and high)
void stack_pop(CallStack *s) {
    if (s->top >= 1) {
        s->top -= 2;
    }
}

// Return current number of frames on stack
int stack_depth(CallStack *s) {
    return (s->top + 1) / 2;
}
