# Reverse a Number

def reverse_number(num):
    res=1

    if num<0:
        num=abs(num)
        res=-1
    res=1
    result=0
    while(num>0):
        store=num%10
        result=result*10+store
        num=num//10
    return result*res
    
        
        
