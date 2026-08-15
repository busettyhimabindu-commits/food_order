#  Find Factorial of a Number

def factorial(num):
    if num<0:
        return 0
    else:
        fact=1
        for i in range(2,num+1):
            fact=fact*i
        return fact
num=int(input("enter the factorial number :-))
print(factorial(num))