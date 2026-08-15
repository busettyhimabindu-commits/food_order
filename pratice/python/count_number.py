# Count Number of Digits

def count_number(num):
    count=0
    for i in str(num):
        if i!= "-":
            count+=1
    return count
            