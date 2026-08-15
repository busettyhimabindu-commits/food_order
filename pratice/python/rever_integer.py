# Reverse an Integer

def reverse_digit(number):
    int_max = 2**31 - 1

    sign = 1 if number >= 0 else -1
    x = abs(number)
    result = 0

    while x > 0:
        digit = x % 10
        x //= 10

        if result > (int_max - digit) // 10:
            return 0

        result = result * 10 + digit

    return sign * result
print(reverse_digit(-123))
        
        