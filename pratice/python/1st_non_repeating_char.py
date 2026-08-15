# Find First Non-Repeating Character


class Solution(object):
    def firstUniqChar(self, s):
      dct={}
      for i in s:
        if i in dct:
            dct[i]+=1
        else:
            dct[i]=1
      for i in range(len(s)):
        if dct[s[i]]==1:
            return i
      return -1

    