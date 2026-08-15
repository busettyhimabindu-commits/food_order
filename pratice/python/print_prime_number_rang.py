# Print Prime Numbers in a Range

def prime(num):
    if num<2:
        return "not prime"
    elif num==2:
        return "prime"
    else:
        for i in range(2,num//2+1):
            if num%i==0:
                return "not prime"
        return "prime"
def print_prime_range(start,end):
    if start<=2:
        start=2
    for i in range(start,end+1):
        value=prime(i)
        if value=="prime":
            print(i)
        
start=int(input("enter the starting value :-"))
end=int(input("enter the ending value :-"))
print(print_prime_range(start,end))

        
    
