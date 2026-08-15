# Check Whether a Number is Palindrome

def number_palidrome(num):
    check=num
    result=0
    while(num>0):
        store=num%10
        result=result*10+store
        num=num//10
    if result==check or result==0:
        return "palindrome"
    else:
        return "not palindrome"
        
num=int(input("enter the numberic value to check a given number is palindrome or not "))
print(number_palidrome(num))

