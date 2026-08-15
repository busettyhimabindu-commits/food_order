# Remove Duplicate Characters from a String

string=input("enter a string value :-")
dct={}
for i in string:
    if i not in dct:
        dct[i]=1
for key,values in dct.items():
    print(key,values)
    