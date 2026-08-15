# Find nth Fibonacci Number

def fibonacci(n):
    a = 0
    b = 1

    for i in range(n):
        a, b = b, a + b

    return a


num = int(input("Enter the position: "))
print("Fibonacci number:", fibonacci(num))