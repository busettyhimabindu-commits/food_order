# Find Largest of Three Numbers

def largest_three_numbers(a,b,c):
    num1=a
    num2=b
    num3=c
    if a>b and a>c:
        return a
    elif b>a and b>c:
        return b
    else:
        return c
a=int(input("enter the value1 :-"))
b=int(input("enter the value2 :-"))
c=int(input("enter the value3 :-"))
print(largest_three_numbers(a,b,c))