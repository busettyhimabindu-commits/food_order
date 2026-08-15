# Check Whether a Number is Prime

def prime(num):
    if num<2:
        return "not prime"
    elif num==2:
        return "prime"
    else:
        for i in range(2,int(num**0.5)+1):
            if num%i==0:
                return "not prime"
        return "prime"
num=int(input("enter the number to check a prime number or not "))
print(prime(num))