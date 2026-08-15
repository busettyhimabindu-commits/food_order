#Count Frequency of Each Character
string=input("enter a string to couunt frequency of each character :-")
dct={}
for i in string:
    if i in dct:
        dct[i]+=1
    else:
        dct[i]=1
for i,j in dct.items():
    print(i,"=",j)
    