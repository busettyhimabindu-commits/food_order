# Generate Fibonacci Series
def fibonacci(num):
    a=0
    b=1
    for i in range(num):
        print(a)
        c=a+b
        a=b
        b=c
num=int(input("enter the fibonacci series number :-))
fibonacci(num)

        

