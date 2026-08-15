#  Find Smallest Element in an Array

lst = [int(i) for i in input().split()]

smallest = lst[0]

for i in lst[1:]:
    if i < smallest:
        smallest = i

print(smallest)