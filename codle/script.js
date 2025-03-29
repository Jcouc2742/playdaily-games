// Game state variables
let secretCode = ""
let attempts = 0
let gameActive = false
let todayDate = ""
let gameState = {}
let gameStats = {}

// Constants
const STORAGE_KEY_STATE = "dailyNumberCrack_state"
const STORAGE_KEY_STATS = "dailyNumberCrack_stats"
const DAILY_CODE_URL = "daily-code.json" // Path to your JSON file

// Initialize the game
async function initGame() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date()
  todayDate = today.toISOString().split("T")[0]

  // Load game stats
  loadGameStats()

  // Check if there's a saved game state
  const savedState = loadGameState()

  // Make sure we're using the correct date format
  if (savedState) {
    // Format the date consistently
    const today = new Date()
    const formattedToday = today.toISOString().split("T")[0]

    if (savedState.date === formattedToday) {
      // We have a saved game for today
      gameState = savedState

      // Ensure the styles array exists for each guess
      if (gameState.guesses) {
        gameState.guesses.forEach((guess) => {
          if (!guess.styles || !Array.isArray(guess.styles)) {
            // Create default styles array if missing
            guess.styles = new Array(5).fill("incorrect")
          }
        })
      }

      // Rest of the existing code...
    }
  }

  if (savedState && savedState.date === todayDate) {
    // We have a saved game for today
    gameState = savedState

    if (gameState.completed) {
      // User already completed today's game
      showCompletedGame()
      return
    } else {
      // Continue the saved game
      secretCode = gameState.secretCode
      attempts = gameState.attempts
      restoreGameBoard()
    }
  } else {
    // Start a new game for today
    await fetchDailyCode()
    gameState = {
      date: todayDate,
      secretCode: secretCode,
      attempts: 0,
      guesses: [],
      completed: false,
    }
    saveGameState()
  }

  gameActive = true
  setupKeypad()
  updateGameStatus()

  // If it's a new game, add the first row
  if (attempts === 0) {
    addRow()
    document.querySelector(".row input").focus()
  }
}

// Fetch the daily code from JSON file
async function fetchDailyCode() {
  try {
    const response = await fetch(DAILY_CODE_URL)
    if (!response.ok) {
      throw new Error("Failed to fetch daily code")
    }

    const data = await response.json()

    // Check if we have a codes array
    if (data.codes && Array.isArray(data.codes)) {
      // Find the code for today's date
      const todayCode = data.codes.find((item) => item.date === todayDate)

      if (todayCode && todayCode.code) {
        // We found a code for today
        secretCode = todayCode.code.toString()
        console.log("Loaded daily code for today:", secretCode)
        return
      }

      // If no code for today, check if we should use the most recent code
      if (data.useLatestIfNoMatch && data.codes.length > 0) {
        // Sort codes by date (newest first)
        const sortedCodes = [...data.codes].sort((a, b) => new Date(b.date) - new Date(a.date))

        // Find the most recent code that's not in the future
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (const codeItem of sortedCodes) {
          const codeDate = new Date(codeItem.date)
          if (codeDate <= today) {
            secretCode = codeItem.code.toString()
            console.log("Using most recent code:", secretCode, "from", codeItem.date)
            return
          }
        }
      }
    }

    // Fallback to single code format for backward compatibility
    if (data.date === todayDate && data.code) {
      secretCode = data.code.toString()
      console.log("Loaded daily code:", secretCode)
      return
    }

    // If we get here, we couldn't find a valid code
    secretCode = generateRandomCode()
    console.log("No matching code found, using random code:", secretCode)
  } catch (error) {
    console.error("Error fetching daily code:", error)
    // Fallback to random code
    secretCode = generateRandomCode()
  }
}

// Generate a random 5-digit code
function generateRandomCode() {
  return String(Math.floor(10000 + Math.random() * 90000))
}

// Save the current game state to localStorage
function saveGameState() {
  localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(gameState))
}

// Load the game state from localStorage
function loadGameState() {
  const savedState = localStorage.getItem(STORAGE_KEY_STATE)
  return savedState ? JSON.parse(savedState) : null
}

// Load game statistics
function loadGameStats() {
  const savedStats = localStorage.getItem(STORAGE_KEY_STATS)
  gameStats = savedStats
    ? JSON.parse(savedStats)
    : {
        gamesPlayed: 0,
        totalGuesses: 0,
        lastPlayed: null,
      }
}

// Save game statistics
function saveGameStats() {
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(gameStats))
}

// Update game statistics when a game is completed
function updateGameStats(guessCount) {
  gameStats.gamesPlayed++
  gameStats.totalGuesses += guessCount
  gameStats.lastPlayed = todayDate
  saveGameStats()
}

// Calculate average guesses
function calculateAverageGuesses() {
  if (gameStats.gamesPlayed === 0) return 0
  return (gameStats.totalGuesses / gameStats.gamesPlayed).toFixed(1)
}

// Show the completed game screen
function showCompletedGame() {
  document.getElementById("completed-code-display").textContent = gameState.secretCode
  document.getElementById("completed-guesses").textContent = gameState.attempts.toString()

  // Start the countdown timer
  startCountdown("completed-countdown-timer")

  // Show the completed modal
  document.getElementById("completed-modal").classList.add("active")

  // Restore the game board to show previous solution
  restoreGameBoard()

  // Disable all inputs
  document.querySelectorAll("input").forEach((input) => {
    input.disabled = true
  })

  gameActive = false
}

// Restore the game board from saved state
function restoreGameBoard() {
  const gameBoard = document.getElementById("game-board")
  gameBoard.innerHTML = ""

  // Recreate each row and apply the saved styles
  for (let i = 0; i < gameState.guesses.length; i++) {
    const guess = gameState.guesses[i]

    // Create row
    const row = document.createElement("div")
    row.classList.add("row")

    // Create cells with inputs
    for (let j = 0; j < 5; j++) {
      const cell = document.createElement("div")
      cell.classList.add("cell")

      const input = document.createElement("input")
      input.type = "text"
      input.maxLength = 1
      input.value = guess.value[j]
      input.disabled = true
      input.setAttribute("data-index", j)
      input.setAttribute("data-row", i)

      // Apply the saved style
      if (guess.styles[j] === "correct") {
        cell.classList.add("correct-cell")
        input.classList.add("correct-cell")
      } else if (guess.styles[j] === "partial") {
        cell.classList.add("partial-cell")
        input.classList.add("partial-cell")
      } else {
        cell.classList.add("incorrect-cell")
        input.classList.add("incorrect-cell")
      }

      cell.appendChild(input)
      row.appendChild(cell)
    }

    gameBoard.appendChild(row)

    // Add hidden feedback element
    const feedback = document.createElement("div")
    feedback.classList.add("feedback")
    feedback.style.display = "none"
    gameBoard.appendChild(feedback)
  }

  // If game is not completed, add a new row for input
  if (!gameState.completed) {
    addRow()
  }
}

// Add a new input row
function addRow() {
  const board = document.getElementById("game-board")
  const rowIndex = document.querySelectorAll(".row").length

  // Create row
  const row = document.createElement("div")
  row.classList.add("row")
  row.classList.add("pop")

  // Create cells with inputs
  for (let i = 0; i < 5; i++) {
    const cell = document.createElement("div")
    cell.classList.add("cell")

    const input = document.createElement("input")
    input.type = "text"
    input.maxLength = 1
    input.setAttribute("data-index", i)
    input.setAttribute("data-row", rowIndex)
    input.inputMode = "numeric" // Show numeric keyboard on mobile

    // Add event listeners
    input.addEventListener("input", handleInput)
    input.addEventListener("keydown", handleKeyPress)
    input.addEventListener("focus", handleFocus)

    cell.appendChild(input)
    row.appendChild(cell)
  }

  // Create feedback element (hidden)
  const feedback = document.createElement("div")
  feedback.classList.add("feedback")
  feedback.style.display = "none"

  // Add to board
  board.appendChild(row)
  board.appendChild(feedback)

  // Scroll to the new row
  row.scrollIntoView({ behavior: "smooth", block: "end" })
}

// Update game status message
function updateGameStatus() {
  const statusElement = document.getElementById("game-status")
  statusElement.textContent = `Today's Challenge - ${todayDate}`
}

// Handle input in cells
function handleInput(event) {
  if (!gameActive) return

  const input = event.target
  const value = input.value

  // Allow only numbers
  if (!/^\d$/.test(value)) {
    input.value = ""
    return
  }

  const rowIndex = Number.parseInt(input.getAttribute("data-row"))
  const row = document.querySelectorAll(".row")[rowIndex]
  const inputs = row.querySelectorAll("input")

  const index = Number.parseInt(input.getAttribute("data-index"))

  // Auto-move to next input
  if (index < 4) {
    inputs[index + 1].focus()
  }
}

// Handle keyboard navigation
function handleKeyPress(event) {
  if (!gameActive) return

  const input = event.target
  const rowIndex = Number.parseInt(input.getAttribute("data-row"))
  const row = document.querySelectorAll(".row")[rowIndex]
  const inputs = row.querySelectorAll("input")
  const index = Number.parseInt(input.getAttribute("data-index"))

  // Handle backspace
  if (event.key === "Backspace") {
    if (input.value === "" && index > 0) {
      inputs[index - 1].focus()
      inputs[index - 1].value = ""
    } else {
      input.value = ""
    }
  }

  // Handle enter key
  if (event.key === "Enter") {
    const isRowComplete = Array.from(inputs).every((input) => input.value.length === 1)
    if (isRowComplete) {
      submitGuess()
    }
  }

  // Handle left/right arrow keys
  if (event.key === "ArrowLeft" && index > 0) {
    inputs[index - 1].focus()
  }

  if (event.key === "ArrowRight" && index < 4) {
    inputs[index + 1].focus()
  }
}

// Handle cell focus
function handleFocus(event) {
  if (!gameActive) return

  // Remove active class from all cells
  document.querySelectorAll(".cell").forEach((cell) => cell.classList.remove("active"))

  // Add active class to current cell
  event.target.parentElement.classList.add("active")
}

// Setup the keypad
function setupKeypad() {
  const keypad = document.getElementById("keypad")
  keypad.innerHTML = ""

  // Create number buttons (0-9)
  const keypadNumbers = [
    ["1", "2", "3", "4", "5"],
    ["6", "7", "8", "9", "0"],
  ]

  // Create number rows
  keypadNumbers.forEach((row) => {
    const keypadRow = document.createElement("div")
    keypadRow.classList.add("keypad-row")

    row.forEach((num) => {
      const button = document.createElement("button")
      button.innerText = num
      button.classList.add("key-button")
      button.addEventListener("click", () => handleKeypadClick(num))
      keypadRow.appendChild(button)
    })

    keypad.appendChild(keypadRow)
  })

  // Create action buttons row
  const actionRow = document.createElement("div")
  actionRow.classList.add("keypad-row")

  const backspaceButton = document.createElement("button")
  backspaceButton.innerText = "⌫"
  backspaceButton.classList.add("action-button")
  backspaceButton.addEventListener("click", handleBackspace)

  const enterButton = document.createElement("button")
  enterButton.innerText = "Enter"
  enterButton.classList.add("action-button")
  enterButton.addEventListener("click", submitGuess)

  actionRow.appendChild(backspaceButton)
  actionRow.appendChild(enterButton)
  keypad.appendChild(actionRow)
}

// Handle keypad number click
function handleKeypadClick(number) {
  if (!gameActive) return

  const currentRow = document.querySelectorAll(".row")[attempts]
  const inputs = currentRow.querySelectorAll("input")

  // Find first empty cell
  for (const input of inputs) {
    if (input.value === "") {
      input.value = number
      input.dispatchEvent(new Event("input"))
      break
    }
  }
}

// Handle backspace button
function handleBackspace() {
  if (!gameActive) return

  const currentRow = document.querySelectorAll(".row")[attempts]
  const inputs = Array.from(currentRow.querySelectorAll("input"))

  // Find last filled cell
  for (let i = inputs.length - 1; i >= 0; i--) {
    if (inputs[i].value !== "") {
      inputs[i].value = ""
      inputs[i].focus()
      return
    }
  }

  // If all empty, focus on first
  inputs[0].focus()
}

// Submit and check the guess
function submitGuess() {
  if (!gameActive) return

  const currentRow = document.querySelectorAll(".row")[attempts]
  const inputs = currentRow.querySelectorAll("input")

  // Get the full guess
  const guess = Array.from(inputs)
    .map((input) => input.value)
    .join("")

  // Check if guess is complete
  if (guess.length !== 5) {
    // Alert user but don't show in feedback area
    currentRow.classList.add("pulse")
    setTimeout(() => {
      currentRow.classList.remove("pulse")
    }, 800)
    return
  }

  // Start checking animation
  inputs.forEach((input) => {
    input.disabled = true
  })

  currentRow.classList.add("pulse")

  // Check the guess
  setTimeout(() => {
    currentRow.classList.remove("pulse")

    // Count correct positions and numbers with marked positions
    const results = checkGuess(guess, secretCode)

    // Create a copy of the code to track which digits we've used
    const codeDigits = secretCode.split("")

    // Store the styles for this guess
    const guessStyles = new Array(5).fill("incorrect")

    // First pass: Mark correct positions (green)
    for (let i = 0; i < 5; i++) {
      if (guess[i] === secretCode[i]) {
        const cell = inputs[i].parentElement
        cell.classList.add("flip")

        setTimeout(() => {
          cell.classList.add("correct-cell")
          inputs[i].classList.add("correct-cell")
          guessStyles[i] = "correct"
        }, i * 150)

        setTimeout(
          () => {
            cell.classList.remove("flip")
          },
          600 + i * 150,
        )

        // Mark this digit as used
        codeDigits[i] = null
      }
    }

    // Second pass: Mark partial matches (yellow) or incorrect (gray)
    for (let i = 0; i < 5; i++) {
      if (guess[i] !== secretCode[i]) {
        const cell = inputs[i].parentElement
        cell.classList.add("flip")

        setTimeout(() => {
          // Check if this digit exists in the remaining code digits
          const indexInCode = codeDigits.indexOf(guess[i])
          if (indexInCode !== -1 && results.markedPositions[i]) {
            cell.classList.add("partial-cell")
            inputs[i].classList.add("partial-cell")
            guessStyles[i] = "partial"
            // Mark this digit as used
            codeDigits[indexInCode] = null
          } else {
            cell.classList.add("incorrect-cell")
            inputs[i].classList.add("incorrect-cell")
          }
        }, i * 150)

        setTimeout(
          () => {
            cell.classList.remove("flip")
          },
          600 + i * 150,
        )
      }
    }

    // Save this guess to game state
    gameState.guesses.push({
      value: guess,
      styles: guessStyles,
    })

    // Update attempts
    attempts++
    gameState.attempts = attempts

    // Save game state
    saveGameState()

    // Check for win
    if (guess === secretCode) {
      gameActive = false
      gameState.completed = true
      saveGameState()

      // Update game statistics
      updateGameStats(attempts)

      // Show results modal after a short delay
      setTimeout(() => {
        showResultsModal()
      }, 1200)
    } else {
      // Add new row for next guess
      addRow()

      // Focus first input of new row
      setTimeout(() => {
        const nextRow = document.querySelectorAll(".row")[attempts]
        if (nextRow) {
          const firstInput = nextRow.querySelector("input")
          firstInput.focus()
        }
      }, 800)
    }
  }, 800)
}

// Show the results modal
function showResultsModal() {
  document.getElementById("secret-code-display").textContent = secretCode
  document.getElementById("current-guesses").textContent = attempts.toString()
  document.getElementById("average-guesses").textContent = calculateAverageGuesses()
  document.getElementById("games-played").textContent = gameStats.gamesPlayed.toString()

  // Start the countdown timer
  startCountdown("countdown-timer")

  // Show confetti
  createConfetti()

  // Show the modal
  document.getElementById("results-modal").classList.add("active")
}

// Start countdown timer to midnight
function startCountdown(elementId) {
  const countdownElement = document.getElementById(elementId)

  // Update the countdown every second
  function updateCountdown() {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const timeRemaining = tomorrow - now

    // Calculate hours, minutes, seconds
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)

    // Format the time
    const formattedTime =
      String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")

    countdownElement.textContent = formattedTime

    // If we've reached midnight, reload the page
    if (timeRemaining <= 0) {
      location.reload()
    }
  }

  // Update immediately and then every second
  updateCountdown()
  setInterval(updateCountdown, 1000)
}

// Check guess against secret code
function checkGuess(guess, code) {
  let correct = 0
  let partial = 0

  // Create copies to mark used digits
  const guessArray = guess.split("")
  const codeArray = code.split("")

  // Track which positions in the guess have been marked
  const markedPositions = new Array(5).fill(false)

  // Count frequency of each digit in the code
  const digitFrequency = {}
  for (const digit of codeArray) {
    digitFrequency[digit] = (digitFrequency[digit] || 0) + 1
  }

  // First pass: Find correct positions
  for (let i = 0; i < 5; i++) {
    if (guessArray[i] === codeArray[i]) {
      correct++
      markedPositions[i] = true
      // Decrease the available frequency for this digit
      digitFrequency[guessArray[i]]--
    }
  }

  // Second pass: Find correct numbers in wrong positions
  for (let i = 0; i < 5; i++) {
    // Skip already marked positions
    if (!markedPositions[i]) {
      // Check if this digit exists in the code and we haven't used all occurrences
      if (digitFrequency[guessArray[i]] && digitFrequency[guessArray[i]] > 0) {
        partial++
        // Decrease the available frequency for this digit
        digitFrequency[guessArray[i]]--
        // Mark this position
        markedPositions[i] = true
      }
    }
  }

  return { correct, partial, markedPositions }
}

// Create confetti for win animation
function createConfetti() {
  const confettiContainer = document.querySelector(".confetti")
  confettiContainer.innerHTML = ""

  const colors = ["#4a56e2", "#4ade80", "#facc15", "#f87171", "#60a5fa"]

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement("div")
    confetti.style.position = "absolute"
    confetti.style.width = Math.random() * 10 + 5 + "px"
    confetti.style.height = Math.random() * 10 + 5 + "px"
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
    confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0"
    confetti.style.top = "-10px"
    confetti.style.left = Math.random() * 100 + "%"
    confetti.style.opacity = Math.random() * 0.8 + 0.2
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`

    // Animation
    confetti.style.animation = `confettiFall ${Math.random() * 3 + 2}s linear forwards`

    // Add keyframes dynamically
    const style = document.createElement("style")
    style.innerHTML = `
            @keyframes confettiFall {
                to {
                    transform: translateY(${400 + Math.random() * 200}px) rotate(${Math.random() * 720}deg);
                    opacity: 0;
                }
            }
        `
    document.head.appendChild(style)

    confettiContainer.appendChild(confetti)
  }
}

// Share results
function shareResults() {
  const text =
    `Daily Number Crack - ${todayDate}\n` +
    `I cracked today's code in ${attempts} guesses!\n` +
    `Play at: [Your Website URL]`

  if (navigator.share) {
    navigator
      .share({
        title: "Daily Number Crack",
        text: text,
      })
      .catch(console.error)
  } else {
    // Fallback - copy to clipboard
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Results copied to clipboard!")
      })
      .catch(console.error)
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the game
  initGame()

  // Start game button
  document.getElementById("start-game").addEventListener("click", () => {
    document.getElementById("start-modal").classList.remove("active")
  })

  // Close results modal
  document.getElementById("close-results-modal").addEventListener("click", () => {
    document.getElementById("results-modal").classList.remove("active")
  })

  // View board button
  document.getElementById("view-board").addEventListener("click", () => {
    document.getElementById("results-modal").classList.remove("active")
  })

  // View completed board button
  document.getElementById("view-completed-board").addEventListener("click", () => {
    document.getElementById("completed-modal").classList.remove("active")
  })

  // Share results button
  document.getElementById("share-results").addEventListener("click", shareResults)
})

