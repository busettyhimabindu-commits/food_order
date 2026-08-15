#  Find Second Largest Element

def secound_largest(num):
    first=float("-inf")
    secound=float("-inf")
    for i in num:
        if first<i:
            secound=first
            first=i
        elif secound<i and i!=first:
            secound=i
    return secound
    
nums=[-2,-2,10,20,10,10,20,10,20]
print(secound_largest(nums))
    
