# check whether a string is a palindrome or not
# this problem we havee to solve into the multiple way's
#1. using a slicing technique 
#2. reverse the string and check with the original_string
#3.two pointer's technique to solve this problem 
#4.recursion technique to solve this problem 


#1.approach one using a slicing technique
def is_palindrome1(string):
    return string==string[::-1]


#2.approach two reverse a string and check with the original string
def is_palindrome2(string):
    reverse_string=""
    for i in range(len(string)-1,-1,-1):
        reverse_string+=string[i]
    value="True" if string==reverse_string else "False"
    return value 

#3.approach three using a two pointer's technique no need to check a whole string 
def is_palindrome3(string):
    left=0
    right=len(string)-1
    while left<right:
        if string[left]!=string[right]:
            return "False"
        else:
            left+=1
            right-=1
    return "True"

#4.approach four using a recursion technique 
def is_palindrome4(string,left,right):
    if left>=right:
        return "True"
    if string[left]!=string[right]:
        return "False"
    return is_palindrome4(string,left+1,right-1)


def main():
    if __name__=="__main__":
        string=input("enter a string to check the palindrome :-")
        print("using a slicing technique: ",is_palindrome1(string))
        print("using a reverse technique: ",is_palindrome2(string))
        print("using a two pointer technique: ",is_palindrome3(string))
        print("using a recursion technique: ",is_palindrome4(string,0,len(string)-1))
main()     