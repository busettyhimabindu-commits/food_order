#  Check Armstrong Number

def armstrong(num):
    if num <0:
        return "not an armstrong number"

    length = len(str(num))
    result = 0

    for i in str(num):
        result += int(i) ** length

    return "armstrong number" if num == result else "not armstrong number"