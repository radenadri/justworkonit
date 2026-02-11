# 01. Contains Duplicate

## Problem

Given an integer array `nums`, return `true` if any value appears **at least twice** in the array, and return `false` if every element is distinct.

---

## Examples

### Example 1

**Input:** `nums = [1, 2, 3, 1]`  
**Output:** `true`  
**Explanation:** The element 1 occurs at indices 0 and 3.

### Example 2

**Input:** `nums = [1, 2, 3, 4]`  
**Output:** `false`  
**Explanation:** All elements are distinct.

### Example 3

**Input:** `nums = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]`  
**Output:** `true`

---

## Constraints

- `1 <= nums.length <= 10^5`
- `-10^9 <= nums[i] <= 10^9`

---

## Solution

### Approach: Sorting

1. Sort the array
2. Iterate through and check if any adjacent elements are equal
3. If found, return `true`; otherwise, return `false`

**Time Complexity:** O(n log n) - due to sorting  
**Space Complexity:** O(1) - in-place sorting (or O(n) depending on sort implementation)

```javascript
class Solution {
    /**
     * @param {number[]} nums
     * @return {boolean}
     */
    hasDuplicate(nums) {
        const sortedNums = nums.sort((a, b) => a - b);

        for (let i = 1; i < sortedNums.length; i++) {
            if (sortedNums[i] === sortedNums[i - 1]) {
                return true;
            }
        }

        return false;
    }
}
```

### Alternative: Hash Set

A more optimal approach uses a Set for O(n) time complexity:

```javascript
class Solution {
    hasDuplicate(nums) {
        const seen = new Set();
        
        for (const num of nums) {
            if (seen.has(num)) {
                return true;
            }
            seen.add(num);
        }
        
        return false;
    }
}
```

**Time Complexity:** O(n)  
**Space Complexity:** O(n)
