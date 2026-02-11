# 05. Top K Frequent Elements

## Problem

**Difficulty:** Medium

Given a non-empty array of integers, return the **k** most frequent elements.

---

## Examples

### Example 1

**Input:** `nums = [1, 1, 1, 2, 2, 3]`, `k = 2`  
**Output:** `[1, 2]`

### Example 2

**Input:** `nums = [1]`, `k = 1`  
**Output:** `[1]`

---

## Constraints

- You may assume `k` is always valid: `1 <= k <= number of unique elements`
- Your algorithm's time complexity **must be** better than O(n log n), where n is the array's size

---

## Solution

### Approach: Hash Map + Sorting

**Strategy:**
1. **Count frequencies:** Use a hash map to count occurrences of each number
2. **Sort by frequency:** Convert to array and sort by count in descending order
3. **Select top k:** Extract the first k elements

> **Related Problem:** [692. Top K Frequent Words](https://leetcode.com/problems/top-k-frequent-words/)

**Time Complexity:** O(n log n) - due to sorting  
**Space Complexity:** O(n)

```javascript
class Solution {
    /**
     * @param {number[]} nums
     * @param {number} k
     * @return {number[]}
     */
    topKFrequent(nums, k) {
        const hashMap = new Map();

        for (const num of nums) {
            hashMap.set(num, (hashMap.get(num) || 0) + 1);
        }

        const list = [...hashMap];
        list.sort((a, b) => b[1] - a[1]);

        const ans = [];
        for (let i = 0; i < k; i++) {
            ans.push(list[i][0]);
        }

        return ans;
    }
}
```

### Alternative: Bucket Sort (O(n) Time)

For better time complexity, use bucket sort where index represents frequency:

```javascript
class Solution {
    topKFrequent(nums, k) {
        const freqMap = new Map();
        
        for (const num of nums) {
            freqMap.set(num, (freqMap.get(num) || 0) + 1);
        }

        // Create buckets where index = frequency
        const buckets = Array(nums.length + 1).fill(null).map(() => []);
        
        for (const [num, freq] of freqMap) {
            buckets[freq].push(num);
        }

        // Collect k most frequent from buckets (highest to lowest)
        const result = [];
        for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) {
            result.push(...buckets[i]);
        }

        return result.slice(0, k);
    }
}
```

**Time Complexity:** O(n)  
**Space Complexity:** O(n)

---

## Edge Cases

- **Frequency ties:** When multiple values share the same count, any order is acceptable
- **k equals unique elements:** Return all unique elements sorted by frequency
