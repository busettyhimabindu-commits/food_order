#  Find Longest Common Prefix
def longest_common_prefix(string):
    if not string:
        return ""
    prefix=string[0]
    for i in range(1,len(string)):
        while string[i].find(prefix)!=0:
            prefix=prefix[:-1]
            if len(prefix)==0:
                return ""
    return prefix


def using_startswith_function(string):
    if not string:
        return ""
    prefix=string[0]
    for word in string[1:]:
        while not word.startswith(prefix):
            prefix=prefix[:-1]
            if not prefix:
                return ""
    return prefix

def main():
    string=["flower","flow","flight"]
    print(longest_common_prefix(string))
    print(using_startswith_function(string))
if __name__=="__main__":
    main()