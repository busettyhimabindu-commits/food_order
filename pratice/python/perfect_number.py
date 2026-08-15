#  Check Perfect Number

def perfect_number(num):
    if num <= 1:
        return "not a perfect number"

    total = 1
    i = 2

    while i * i <= num:
        if num % i == 0:
            total += i

            if i != num // i:
                total += num // i

        i += 1

    return "perfect number" if total == num else "not a perfect number"
print(perfect_number(6))
print(perfect_number(100))