import random

def play():
    print("🎮 Welcome to PyGuess!")
    secret = random.randint(1, 100)
    guess = None
    attempts = 0

    while guess != secret:
        try:
            guess = int(input("Enter a number between 1 and 100: "))
            attempts += 1
            if guess < secret:
                print("Too low! Try again.")
            elif guess > secret:
                print("Too high! Try again.")
        except ValueError:
            print("Please enter a valid integer.")

    print(f"🎉 Congratulations! You guessed it in {attempts} attempts.")

if __name__ == "__main__":
    play()
