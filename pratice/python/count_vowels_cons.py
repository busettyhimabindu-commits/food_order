#Count Vowels and Consonants in a String
string = input("Enter a string to count vowels and consonants: ")

count_vo = 0
count_cons = 0

for i in string:
    if i in "aeiouAEIOU":
        count_vo += 1
    elif (ord(i) >= 65 and ord(i) <= 90) or (ord(i) >= 97 and ord(i) <= 122):
        count_cons += 1

print("Vowels in the string are :- {} and consonants in the string are :- {}".format(
    count_vo, count_cons
))