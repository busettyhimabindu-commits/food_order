# Find Sum of Digits

def sum_digits(num):
    if num>0:
        num=abs(num)
    result=0
    for i in str(num):
        result=result+int(i)
    return result 
    
    
    
