document.addEventListener("DOMContentLoaded", () => {
    // Check if we should show the archive immediately
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("showArchive") === "true") {
      // Small delay to ensure the archive is rendered before opening
      setTimeout(() => {
        archiveToggle.click()
      }, 500)
    }
  
    // Game state
    let remainingGuesses = 5
    let part2Active = false
    let currentQuestionData = null
    let score = 0
    let currentDateKey = ""
    let allQuizDates = []
  
    // DOM elements
    const howToPlayPopup = document.getElementById("how-to-play")
    const closeHowToPlayBtn = document.getElementById("close-how-to-play")
    const howToPlayBtn = document.getElementById("how-to-play-btn")
    const questionPart1 = document.getElementById("question-part1")
    const questionPart2 = document.getElementById("question-part2")
    const questionPart2Container = document.getElementById("question-part2-container")
    const optionsContainer = document.getElementById("options-container")
    const archiveToggle = document.getElementById("archive-toggle")
    const archiveContent = document.getElementById("archive-content")
    const archiveList = document.getElementById("archive-list")
    const alreadyPlayedPopup = document.getElementById("already-played")
    const alreadyPlayedBtn = document.getElementById("already-played-btn")
    const alreadyPlayedCountdown = document.getElementById("already-played-countdown")
    const gameCompletedPopup = document.getElementById("game-completed")
    const completionBtn = document.getElementById("completion-btn")
    // Add these DOM element references near the top with the other DOM elements
    const closePopupBtn = document.getElementById("close-popup")
    const closeGameCompletedBtn = document.getElementById("close-game-completed")
    const closeAlreadyPlayedBtn = document.getElementById("close-already-played")
    const revealAnswersBtn = document.getElementById("reveal-answers-btn")
    const answersPopup = document.getElementById("answers-popup")
    const closeAnswersBtn = document.getElementById("close-answers")
    const answersGridContainer = document.getElementById("answers-grid-container")
  
    // Set up archive toggle
    archiveToggle.addEventListener("click", () => {
      archiveToggle.classList.toggle("active")
      archiveContent.classList.toggle("active")
    })
  
    // Already played button handler
    alreadyPlayedBtn.addEventListener("click", () => {
      // Go back to the quiz page and open the archive
      window.location.href = "world.html?showArchive=true"
    })
  
    // Completion button handler
    completionBtn.addEventListener("click", () => {
      window.location.href = "../index.html"
    })
  
    // Get current date in format MM-DD
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    currentDateKey = `${month}-${day}`
  
    // Check if user has already played today's quiz
    const completedQuizzes = getCompletedQuizzes()
  
    // Load all quizzes
    loadQuizData().then((data) => {
      // Get all available quiz dates
      allQuizDates = Object.keys(data).filter((key) => key !== "default")
  
      // Populate archive
      populateArchive(allQuizDates, completedQuizzes)
  
      // Check URL for date parameter
      const urlParams = new URLSearchParams(window.location.search)
      const dateParam = urlParams.get("date")
  
      // Determine which quiz we're trying to play
      const quizToPlay = dateParam || currentDateKey
  
      // Only show "already played" if the specific quiz has been completed
      if (completedQuizzes.includes(quizToPlay)) {
        showAlreadyPlayedPopup()
      } else {
        // Show how to play popup when the page loads
        showHowToPlay()
      }
    })
  
    // Start countdown timer for already played popup
    startCountdown(alreadyPlayedCountdown)
  
    // How to play popup handlers
    closeHowToPlayBtn.addEventListener("click", () => {
      howToPlayPopup.classList.add("hidden")
      startGame()
    })
  
    howToPlayBtn.addEventListener("click", () => {
      howToPlayPopup.classList.add("hidden")
      startGame()
    })
  
    // Add these event listeners after the other event listeners
    closePopupBtn.addEventListener("click", () => {
      document.getElementById("popup").classList.add("hidden")
    })
  
    closeGameCompletedBtn.addEventListener("click", () => {
      gameCompletedPopup.classList.add("hidden")
    })
  
    closeAlreadyPlayedBtn.addEventListener("click", () => {
      alreadyPlayedPopup.classList.add("hidden")
    })
  
    closeAnswersBtn.addEventListener("click", () => {
      answersPopup.classList.add("hidden")
    })
  
    revealAnswersBtn.addEventListener("click", () => {
      showAnswersPopup()
    })
  
    // Function to show how to play popup
    function showHowToPlay() {
      howToPlayPopup.classList.remove("hidden")
    }
  
    // Function to show already played popup
    function showAlreadyPlayedPopup() {
      // Update the popup message to be more specific about which quiz has been completed
      const urlParams = new URLSearchParams(window.location.search)
      const dateParam = urlParams.get("date")
      const quizDate = dateParam || currentDateKey
  
      // Format the date for display
      let displayDate
      if (quizDate === "default") {
        displayDate = "Practice Quiz"
      } else {
        const [month, day] = quizDate.split("-")
        displayDate = `${month}/${day}`
      }
  
      // Update the popup title
      const alreadyPlayedTitle = document.querySelector("#already-played h2")
      alreadyPlayedTitle.textContent = `You've Already Played Todays Quiz!`
  
      alreadyPlayedPopup.classList.remove("hidden")
    }
  
    // Function to load quiz data
    async function loadQuizData() {
      try {
        const response = await fetch("worldquestions.json")
        return await response.json()
      } catch (error) {
        console.error("Error loading questions:", error)
        return { default: {} }
      }
    }
  
    // Function to populate archive
    function populateArchive(dates, completedQuizzes) {
      // Clear existing content
      archiveList.innerHTML = ""
  
      // Sort dates chronologically
      dates.sort((a, b) => {
        const [aMonth, aDay] = a.split("-").map(Number)
        const [bMonth, bDay] = b.split("-").map(Number)
  
        if (aMonth !== bMonth) {
          return aMonth - bMonth
        }
        return aDay - bDay
      })
  
      // Add "default" quiz if it exists
      if (!dates.includes("default")) {
        dates.unshift("default")
      }
  
      // Create archive items
      dates.forEach((date) => {
        const item = document.createElement("div")
        item.classList.add("archive-item")
  
        // Format the date for display
        let displayDate
        if (date === "default") {
          displayDate = "Practice Quiz"
        } else {
          const [month, day] = date.split("-")
          displayDate = `${month}/${day}`
        }
  
        item.textContent = displayDate
  
        // Add appropriate classes
        if (date === currentDateKey) {
          item.classList.add("today")
        }
  
        if (completedQuizzes.includes(date)) {
          item.classList.add("completed")
          item.title = "Already completed"
        } else {
          // Check if this date is in the future
          const [month, day] = date.split("-").map(Number)
          const currentMonth = today.getMonth() + 1
          const currentDay = today.getDate()
  
          if (month > currentMonth || (month === currentMonth && day > currentDay)) {
            item.classList.add("future")
            item.title = "Available in the future"
          } else {
            item.title = "Click to play this quiz"
  
            // Add click event for available quizzes
            item.addEventListener("click", () => {
              // If it's not today's quiz, redirect with date parameter
              if (date !== currentDateKey && date !== "default") {
                window.location.href = `world.html?date=${date}`
              } else {
                // For today's quiz or default, just reload
                window.location.reload()
              }
            })
          }
        }
  
        archiveList.appendChild(item)
      })
    }
  
    // Function to start the game
    function startGame() {
      // Reset game state
      resetGame()
  
      // Check URL for date parameter
      const urlParams = new URLSearchParams(window.location.search)
      const dateParam = urlParams.get("date")
  
      // Use date from URL or current date
      const dateKey = dateParam || currentDateKey
  
      // Load questions based on date
      loadQuizData()
        .then((data) => {
          // Check if we have a question for the specified date
          if (data[dateKey]) {
            currentQuestionData = data[dateKey]
          } else {
            // Fallback to a default question if no question exists for the date
            currentQuestionData = data.default || data[Object.keys(data)[0]]
          }
          startQuiz(currentQuestionData)
        })
        .catch((error) => {
          console.error("Error loading questions:", error)
          showPopup("Error loading questions. Please try again.", () => {
            window.location.href = "../index.html"
          })
        })
    }
  
    // Function to reset game state
    function resetGame() {
      remainingGuesses = 5
      part2Active = false
      score = 0
      document.getElementById("guesses-left").textContent = remainingGuesses
      document.getElementById("score-display").textContent = score
      questionPart2Container.classList.add("hidden")
    }
  
    // Function to start the quiz
    function startQuiz(questionData) {
      // Set the question text
      questionPart1.textContent = questionData.question_part1
  
      // Create options grid
      optionsContainer.innerHTML = ""
      const optionsGrid = document.createElement("div")
      optionsGrid.classList.add("options")
  
      // Create a copy of the options array and shuffle it
      const shuffledOptions = [...questionData.options]
      shuffleArray(shuffledOptions)
  
      // Create a 3x3 grid (9 slots)
      for (let i = 0; i < 9; i++) {
        const button = document.createElement("button")
  
        // If we have an option for this position, use it
        if (i < shuffledOptions.length) {
          button.textContent = shuffledOptions[i]
          button.onclick = (e) => handleElimination(e, shuffledOptions[i], questionData, button)
          button.classList.add("active-option")
        } else {
          // Otherwise, create an empty placeholder
          button.disabled = true
          button.classList.add("placeholder-option")
        }
  
        optionsGrid.appendChild(button)
      }
  
      optionsContainer.appendChild(optionsGrid)
    }
  
    // Add this shuffle function after the startQuiz function
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
      }
      return array
    }
  
    // Function to handle elimination
    function handleElimination(event, selected, questionData, button) {
      if (part2Active || remainingGuesses <= 0 || button.classList.contains("eliminated")) return
  
      remainingGuesses--
      document.getElementById("guesses-left").textContent = remainingGuesses
  
      if (questionData.incorrect_answers.includes(selected)) {
        button.classList.add("eliminated")
  
        // Add 100 points for correct elimination
        score += 100
        document.getElementById("score-display").textContent = score
  
        // Show points animation
        showPointsAnimation(event, 100)
  
        // Add a small delay for visual feedback
        setTimeout(() => {
          // Check if all incorrect answers have been eliminated
          const allIncorrectEliminated = questionData.incorrect_answers.every((answer) => {
            const buttons = document.querySelectorAll(".options button.active-option")
            for (const btn of buttons) {
              if (btn.textContent === answer && !btn.classList.contains("eliminated")) {
                return false
              }
            }
            return true
          })
  
          if (allIncorrectEliminated) {
            showPopup("Great job! You've eliminated all incorrect answers!", () => {
              startPart2(questionData)
            })
          }
  
          // If no more guesses, move to part 2
          if (remainingGuesses === 0) {
            startPart2(questionData)
          }
        }, 300)
      } else {
        button.classList.add("incorrect")
        // Shake animation effect
        setTimeout(() => {
          button.classList.remove("incorrect")
  
          // If no more guesses, move to part 2
          if (remainingGuesses === 0) {
            startPart2(questionData)
          }
        }, 500)
      }
    }
  
    // Function to start part 2
    function startPart2(questionData) {
      part2Active = true
  
      // Fade out instructions
      const instructionsText = document.getElementById("instructions-text")
      instructionsText.classList.add("fade-out")
  
      // After the fade out animation, show part 2 question
      setTimeout(() => {
        // Show part 2 question between part 1 and options
        const part2Container = document.getElementById("question-part2-container")
        part2Container.classList.remove("hidden")
        document.getElementById("question-part2").textContent = questionData.question_part2
  
        // Fade in the part 2 container
        setTimeout(() => {
          part2Container.classList.add("visible")
        }, 50)
      }, 500) // This should match the CSS transition time
  
      // Only non-eliminated options are clickable in part 2
      document.querySelectorAll(".options button").forEach((button) => {
        if (!button.classList.contains("eliminated") && !button.classList.contains("placeholder-option")) {
          button.onclick = (e) => checkFinalAnswer(e, button.textContent, questionData.correct_answer_part2, button)
        }
      })
  
      
    }
  
    // Function to check final answer
    function checkFinalAnswer(event, selected, correctAnswer, button) {
      let isCorrect = false
  
      if (selected === correctAnswer) {
        // Correct answer - turn button gold
        button.style.backgroundColor = "gold"
        button.style.color = "#333"
        button.style.fontWeight = "bold"
  
        // Add 500 points for correct final answer
        score += 500
        document.getElementById("score-display").textContent = score
  
        // Show points animation
        showPointsAnimation(event, 500, true)
  
        isCorrect = true
      } else {
        // Incorrect answer - flash red
        button.classList.add("incorrect")
      }
  
      // Disable all buttons in Part 2 after a selection is made
      document.querySelectorAll(".options button").forEach((btn) => {
        btn.onclick = null
        btn.style.cursor = "default"
      })
  
      // Save score and show completion popup after a short delay
      setTimeout(() => {
        saveGameResult(score)
        showCompletionPopup(isCorrect)
      }, 1000)
    }
  
    // Function to save game result
    function saveGameResult(finalScore) {
      // Don't save if it's not today's quiz (e.g., playing an archive quiz)
      const urlParams = new URLSearchParams(window.location.search)
      const dateParam = urlParams.get("date")
      if (dateParam && dateParam !== currentDateKey) return
  
      // Get existing scores
      const scoresData = localStorage.getItem("worldScores")
      const scores = scoresData ? JSON.parse(scoresData) : {}
  
      // Add this score
      if (!scores[currentDateKey]) {
        scores[currentDateKey] = []
      }
      scores[currentDateKey].push(finalScore)
  
      // Save back to localStorage
      localStorage.setItem("worldScores", JSON.stringify(scores))
  
      // Mark this quiz as completed
      const completedQuizzes = getCompletedQuizzes()
      if (!completedQuizzes.includes(currentDateKey)) {
        completedQuizzes.push(currentDateKey)
        localStorage.setItem("completedWorldQuizzes", JSON.stringify(completedQuizzes))
      }
    }
  
    // Function to get completed quizzes
    function getCompletedQuizzes() {
      const completedData = localStorage.getItem("completedWorldQuizzes")
      return completedData ? JSON.parse(completedData) : []
    }
  
    // Function to calculate average score
    function calculateAverageScore() {
      const scoresData = localStorage.getItem("worldScores")
      if (!scoresData) return 0
  
      const scores = JSON.parse(scoresData)
      let allScores = []
  
      // Collect all scores from all dates
      for (const dateKey in scores) {
        allScores = allScores.concat(scores[dateKey])
      }
  
      // Calculate average
      if (allScores.length === 0) return 0
      const sum = allScores.reduce((total, score) => total + score, 0)
      return Math.round(sum / allScores.length)
    }
  
    // Function to show completion popup
    function showCompletionPopup(isCorrect) {
      // Set message based on success or failure
      const completionMessage = document.getElementById("completion-message")
      if (isCorrect) {
        completionMessage.textContent = "Congratulations!"
      } else {
        completionMessage.textContent = "Game Over!"
      }
  
      // Set final score
      document.getElementById("final-score").textContent = score
  
      // Set average score
      const averageScore = calculateAverageScore()
      document.getElementById("average-score").textContent = averageScore
  
      // Start countdown timer
      startCountdown(document.getElementById("countdown-timer"))
  
      // Show popup
      gameCompletedPopup.classList.remove("hidden")
    }
  
    // Function to start countdown to midnight GMT
    function startCountdown(element) {
      function updateCountdown() {
        const now = new Date()
        const midnight = new Date()
        midnight.setUTCHours(24, 0, 0, 0) // Next midnight GMT
  
        const diff = midnight - now
  
        // Calculate hours, minutes, seconds
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
        // Format with leading zeros
        const formattedHours = String(hours).padStart(2, "0")
        const formattedMinutes = String(minutes).padStart(2, "0")
        const formattedSeconds = String(seconds).padStart(2, "0")
  
        // Update element
        element.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
      }
  
      // Update immediately and then every second
      updateCountdown()
      setInterval(updateCountdown, 1000)
    }
  
    // Function to show points animation
    function showPointsAnimation(event, points, isBonus = false) {
      // Get the exact position where the click happened
      const x = event.pageX
      const y = event.pageY
  
      const pointsElement = document.createElement("div")
      pointsElement.textContent = `+${points}`
      pointsElement.classList.add("points-animation")
      if (isBonus) {
        pointsElement.classList.add("bonus")
      }
  
      // Position the element exactly where the click happened
      pointsElement.style.left = `${x}px`
      pointsElement.style.top = `${y}px`
  
      document.body.appendChild(pointsElement)
  
      // Remove the element after animation completes
      setTimeout(() => {
        document.body.removeChild(pointsElement)
      }, 1500)
    }
  
    // Function to show popup
    function showPopup(message, callback) {
      const popup = document.getElementById("popup")
      const popupMessage = document.getElementById("popup-message")
      const popupBtn = document.getElementById("popup-btn")
  
      popupMessage.textContent = message
      popup.classList.remove("hidden")
  
      popupBtn.onclick = () => {
        popup.classList.add("hidden")
        if (callback) callback()
      }
      // Also allow closing with the X button
      closePopupBtn.onclick = () => {
        popup.classList.add("hidden")
        if (callback) callback()
      }
    }
  
    // Add this function to show the answers popup
    function showAnswersPopup() {
      // Make sure we have question data
      if (!currentQuestionData) return
  
      // Clear previous content
      answersGridContainer.innerHTML = ""
  
      // Create a grid to display answers
      const answersGrid = document.createElement("div")
      answersGrid.classList.add("answers-grid")
  
      // Create a copy of the options array
      const options = [...currentQuestionData.options]
  
      // Create a 3x3 grid (9 slots)
      for (let i = 0; i < 9; i++) {
        const tile = document.createElement("div")
        tile.classList.add("answer-tile")
  
        // If we have an option for this position, use it
        if (i < options.length) {
          tile.textContent = options[i]
  
          // Mark the tile based on whether it's a correct or incorrect answer
          if (currentQuestionData.incorrect_answers.includes(options[i])) {
            tile.classList.add("incorrect")
          } else if (options[i] === currentQuestionData.correct_answer_part2) {
            tile.classList.add("correct")
          } else {
            tile.classList.add("neutral")
          }
        } else {
          // Empty placeholder
          tile.classList.add("neutral")
        }
  
        answersGrid.appendChild(tile)
      }
  
      answersGridContainer.appendChild(answersGrid)
  
      // Show the popup
      answersPopup.classList.remove("hidden")
    }
  })
  
  document.getElementById("shareButton").addEventListener("click", async () => {
    const score = document.getElementById("final-score").textContent; // Replace with how you get the player's score
    const gameUrl = "https://impossiquiz.com/world.html"; // Change this to your game URL
  
    const shareData = {
        text: `I scored ${score} points! Can you beat me? Try it here:`,
        url: gameUrl
    };
  
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            console.log("Game shared successfully");
        } catch (error) {
            console.error("Error sharing:", error);
        }
    } else {
        alert("Sharing not supported on this device.");
    }
  });