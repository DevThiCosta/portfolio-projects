import random

# Difficulty settings: range of numbers and max attempts
DIFFICULTY_LEVELS = {
    "easy": {"range": (1, 10), "attempts": 6},
    "medium": {"range": (1, 50), "attempts": 8},
    "hard": {"range": (1, 100), "attempts": 10},
}

def choose_difficulty():
    """Ask the player to choose a difficulty level."""
    print("Choose a difficulty level: easy / medium / hard")
    while True:
        choice = input("> ").lower()
        if choice in DIFFICULTY_LEVELS:
            return DIFFICULTY_LEVELS[choice]
        print("Invalid choice! Please type easy, medium, or hard.")

def play():
    """Main game loop."""
    print("🎮 Welcome to PyGuess!")

    # Select difficulty
    settings = choose_difficulty()
    low, high = settings["range"]
    attempts_left = settings["attempts"]

    # Generate the secret number
    secret = random.randint(low, high)
    guess = None
    attempts = 0

    print(f"\nI'm thinking of a number between {low} and {high}. You have {attempts_left} attempts.")

    # Game loop
    while guess != secret and attempts_left > 0:
        try:
            guess = int(input("Enter your guess: "))
            attempts += 1
            attempts_left -= 1

            if guess < secret:
                print(f"Too low! Attempts left: {attempts_left}")
            elif guess > secret:
                print(f"Too high! Attempts left: {attempts_left}")
        except ValueError:
            print("Please enter a valid integer.")

    # Final result
    if guess == secret:
        print(f"🎉 Congratulations! You guessed it in {attempts} attempts.")
    else:
        print(f"❌ Out of attempts! The number was {secret}.")

if __name__ == "__main__":
    play()
