#take a input from the user after revser a user input don't use a predefined method to reverse the string

string=input("enter a string to reverse: ")
reverse_string=""
for i in range(len(string)-1,0,-1):
    reverse_string+=string[i]
print("reversed string is: ",reverse_string)
