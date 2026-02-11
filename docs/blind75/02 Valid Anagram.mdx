# 02. Valid Anagram

## Problem

Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.

---

## Examples

### Example 1

**Input:** `s = "anagram"`, `t = "nagaram"`  
**Output:** `true`

### Example 2

**Input:** `s = "rat"`, `t = "car"`  
**Output:** `false`

---

## Constraints

- `1 <= s.length, t.length <= 5 * 10^4`
- `s` and `t` consist of lowercase English letters.

---

## Follow-up

What if the inputs contain Unicode characters? How would you adapt your solution to such a case?

> **Answer:** Use a `Map` instead of a fixed-size array to count character frequencies, as Unicode has a much larger character set.

---

## Solution

### Approach: Character Counting

1. If lengths differ, return `false` immediately
2. Use an array of 26 elements to count character frequencies
3. Increment count for characters in `s`, decrement for characters in `t`
4. If all counts are zero, the strings are anagrams

**Time Complexity:** O(n)  
**Space Complexity:** O(1) - fixed array of 26 elements

```javascript
class Solution {
    /**
     * @param {string} s
     * @param {string} t
     * @return {boolean}
     */
    isAnagram(s, t) {
        if (s.length !== t.length) {
            return false;
        }

        const cnt = Array(26).fill(0);

        for (let i = 0; i < s.length; ++i) {
            ++cnt[s.charCodeAt(i) - 'a'.charCodeAt(0)];
            --cnt[t.charCodeAt(i) - 'a'.charCodeAt(0)];
        }

        return cnt.every(x => x === 0);
    }
}
```

### Alternative: Sorting

```javascript
class Solution {
    isAnagram(s, t) {
        if (s.length !== t.length) return false;
        return s.split('').sort().join('') === t.split('').sort().join('');
    }
}
```

**Time Complexity:** O(n log n)  
**Space Complexity:** O(n)
