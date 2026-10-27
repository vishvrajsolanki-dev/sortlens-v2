// hashtable.c - Hash table with separate chaining (Unit 6 / Practical 10)
// Table size 11, hash function: value % 11. Used for duplicate analysis.
#include <stdlib.h>
#include "sortlens.h"

// Initialize hash table buckets to NULL
void ht_init(HashTable *ht) {
    int i;
    for (i = 0; i < HASH_TABLE_SIZE; i++) {
        ht->buckets[i] = NULL;
    }
    ht->distinct_count = 0;
    ht->collision_count = 0;
}

// Insert value. Returns 1 if newly inserted (distinct), 0 if duplicate.
int ht_insert(HashTable *ht, int val) {
    int bucket = (val % HASH_TABLE_SIZE + HASH_TABLE_SIZE) % HASH_TABLE_SIZE;
    HashNode *curr = ht->buckets[bucket];

    // Check if value already exists in the chain
    while (curr != NULL) {
        if (curr->value == val) {
            return 0; // Already seen
        }
        curr = curr->next;
    }

    // If bucket was non-empty, this new distinct value is a collision
    if (ht->buckets[bucket] != NULL) {
        ht->collision_count++;
    }

    // Insert at head of the bucket list
    HashNode *node = (HashNode *)malloc(sizeof(HashNode));
    if (!node) return 0;
    node->value = val;
    node->next = ht->buckets[bucket];
    ht->buckets[bucket] = node;

    ht->distinct_count++;
    return 1;
}

// Count nodes in a specific bucket chain
int ht_chain_length(const HashTable *ht, int bucket) {
    if (bucket < 0 || bucket >= HASH_TABLE_SIZE) return 0;
    int len = 0;
    HashNode *curr = ht->buckets[bucket];
    while (curr != NULL) {
        len++;
        curr = curr->next;
    }
    return len;
}

// Get k-th node's value in a bucket chain (0-indexed from head)
int ht_chain_value(const HashTable *ht, int bucket, int k) {
    if (bucket < 0 || bucket >= HASH_TABLE_SIZE) return -1;
    int idx = 0;
    HashNode *curr = ht->buckets[bucket];
    while (curr != NULL) {
        if (idx == k) return curr->value;
        idx++;
        curr = curr->next;
    }
    return -1;
}

// Free all allocated nodes across all buckets
void ht_free(HashTable *ht) {
    int i;
    for (i = 0; i < HASH_TABLE_SIZE; i++) {
        HashNode *curr = ht->buckets[i];
        while (curr != NULL) {
            HashNode *next = curr->next;
            free(curr);
            curr = next;
        }
        ht->buckets[i] = NULL;
    }
}
