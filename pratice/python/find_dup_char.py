# Find Duplicate Characters in a String
string=input("enter a string :-")
dct={}
for i in string:
    if i in dct:
        dct[i]+=1
    else:
        dct[i]=1
        
for key,value in dct.items():
    if value>1:
        print((f"duplicate character is {key} and its count is {value}"))