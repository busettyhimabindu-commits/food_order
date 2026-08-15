# Convert String to Lowercase Without Using Built-in Method
import __main__


def convert_to_lowercase(input_string):
    lowercase_string=""
    for char in input_string:
        value=ord(char)
        if value>=65 and value <=90:
            lowercase_string+=chr(value+32)
        else:
            lowercase_string+=char
    return lowercase_string

def main():
    input_string="hello world"
    result=convert_to_lowercase(input_string)
    print(result)
if __name__=="__main__":
    main()