# check whether two strings are anagram's

class Solution(object):
    def isAnagram(self, s, t):
        if len(s) != len(t):
            return False

        dct1 = {}
        dct2 = {}

        for i in s:
            if i in dct1:
                dct1[i] += 1
            else:
                dct1[i] = 1

        for j in t:
            if j in dct2:
                dct2[j] += 1
            else:
                dct2[j] = 1

        for key, value in dct1.items():
            if key not in dct2:
                return False
            else:
                store = dct2[key]

                if store != value:
                    return False

        return True