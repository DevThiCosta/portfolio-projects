import random

def play():
    print("🎮 Welcome to PyGuess!")
    secret = random.randint(1, 100)
    guess = None

    while guess != secret:
        try:
            guess = int(input("Your guess (1-100): "))
            if guess == secret:
                print("🎉 Correct!")
        except ValueError:
            print("Please enter a valid number.")

if __name__ == "__main__":
    play()
