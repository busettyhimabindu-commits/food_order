# Find Largest Element in an Array

lst=input().split()
largest=lst[0]
for i in lst[1:]:
    if largest<i:
        largest=i
print("largest element in the array is :-",largest)

