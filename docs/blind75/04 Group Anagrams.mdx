# 04. Group Anagrams

## Problem

Given an array of strings `strs`, group **the anagrams** together. You can return the answer in **any order**.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

---

## Examples

### Example 1

**Input:** `strs = ["eat", "tea", "tan", "ate", "nat", "bat"]`  
**Output:** `[["bat"], ["nat", "tan"], ["ate", "eat", "tea"]]`

### Example 2

**Input:** `strs = [""]`  
**Output:** `[[""]]`

### Example 3

**Input:** `strs = ["a"]`  
**Output:** `[["a"]]`

---

## Constraints

- `1 <= strs.length <= 10^4`
- `0 <= strs[i].length <= 100`
- `strs[i]` consists of lowercase English letters.

---

## Solutions

### Solution 1: Sorting + Hash Table

**Approach:**
1. Traverse the string array, sort each string in character dictionary order to get a new string
2. Use the sorted string as `key` and `[str]` as `value`, store in the hash table
3. When encountering the same `key`, add the original string to the corresponding `value`

**Example Walkthrough:**

For `strs = ["eat", "tea", "tan", "ate", "nat", "bat"]`:

| Key     | Value                     |
|---------|---------------------------|
| `"aet"` | `["eat", "tea", "ate"]`   |
| `"ant"` | `["tan", "nat"]`          |
| `"abt"` | `["bat"]`                 |

**Time Complexity:** O(n × k log k), where n = array length, k = max string length  
**Space Complexity:** O(n × k)

```javascript
class Solution {
    /**
     * @param {string[]} strs
     * @return {string[][]}
     */
    groupAnagrams(strs) {
        const map = new Map();

        for (const str of strs) {
            const sortedStr = str.split('').sort().join('');

            if (!map.has(sortedStr)) {
                map.set(sortedStr, []);
            }

            map.get(sortedStr).push(str);
        }

        return Array.from(map.values());
    }
}
```

### Solution 2: Character Counting

**Approach:**
Instead of sorting, count character frequencies and use the count as the key.

**Time Complexity:** O(n × k), where n = array length, k = max string length  
**Space Complexity:** O(n × k)

```javascript
class Solution {
    groupAnagrams(strs) {
        const map = new Map();

        for (const str of strs) {
            const count = Array(26).fill(0);
            
            for (const char of str) {
                count[char.charCodeAt(0) - 'a'.charCodeAt(0)]++;
            }
            
            const key = count.join('#');
            
            if (!map.has(key)) {
                map.set(key, []);
            }
            
            map.get(key).push(str);
        }

        return Array.from(map.values());
    }
}
```
