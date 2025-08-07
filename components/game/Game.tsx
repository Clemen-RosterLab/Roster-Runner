'use client'

import { useEffect, useRef, useState } from 'react'
import { GameState, Player, Obstacle, Raindrop } from '@/lib/game/types'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_X,
  PLAYER_Y,
  GRAVITY,
  JUMP_VELOCITY,
  INITIAL_GAME_SPEED,
  SPEED_INCREMENT,
  PIT_WIDTH,
  PIT_HEIGHT,
  RESIGNATION_WIDTH,
  RESIGNATION_HEIGHT,
  MIN_OBSTACLE_DISTANCE,
  MAX_OBSTACLE_DISTANCE,
  WINTER_SEASON_SCORE,
  WINTER_SPEED_MULTIPLIER,
  BANNER_HEIGHT,
  BANNER_ANIMATION_SPEED,
  RAIN_COUNT,
  RAIN_SPEED_MIN,
  RAIN_SPEED_MAX
} from '@/lib/game/constants'

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const [isRunning, setIsRunning] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const resignationImageRef = useRef<HTMLImageElement>()
  const [imageLoaded, setImageLoaded] = useState(false)
  const doctorImageRef = useRef<HTMLImageElement>()
  const [doctorImageLoaded, setDoctorImageLoaded] = useState(false)
  const sickLeaveImageRef = useRef<HTMLImageElement>()
  const [sickLeaveImageLoaded, setSickLeaveImageLoaded] = useState(false)
  
  const gameStateRef = useRef<GameState>({
    player: {
      x: PLAYER_X,
      y: PLAYER_Y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      velocityY: 0,
      isJumping: false
    },
    obstacles: [],
    score: 0,
    highScore: 0,
    isGameOver: false,
    gameSpeed: INITIAL_GAME_SPEED,
    isWinterSeason: false,
    winterBannerY: -BANNER_HEIGHT,
    raindrops: []
  })

  const pitLabels = ['Exam Week', 'Public Holiday', 'Sick Leave', 'System Down', 'Staff Meeting']
  
  const initializeRaindrops = (): Raindrop[] => {
    const raindrops: Raindrop[] = []
    for (let i = 0; i < RAIN_COUNT; i++) {
      raindrops.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        speed: RAIN_SPEED_MIN + Math.random() * (RAIN_SPEED_MAX - RAIN_SPEED_MIN),
        length: 15 + Math.random() * 20
      })
    }
    return raindrops
  }
  
  const createObstacle = (): Obstacle => {
    const type = Math.random() > 0.6 ? 'resignation' : 'pit'
    const obstacle: Obstacle = {
      x: GAME_WIDTH,
      y: type === 'pit' 
        ? GAME_HEIGHT - GROUND_HEIGHT - PIT_HEIGHT / 2
        : GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT - 80 - Math.random() * 40,
      width: type === 'pit' ? PIT_WIDTH : RESIGNATION_WIDTH,
      height: type === 'pit' ? PIT_HEIGHT : RESIGNATION_HEIGHT,
      type,
      velocityX: -gameStateRef.current.gameSpeed,
      velocityY: type === 'resignation' ? Math.sin(Date.now() * 0.003) * 2 : undefined
    }
    
    if (type === 'pit') {
      obstacle.label = pitLabels[Math.floor(Math.random() * pitLabels.length)]
    }
    
    return obstacle
  }

  const handleJump = () => {
    const player = gameStateRef.current.player
    if (!player.isJumping && !gameStateRef.current.isGameOver) {
      player.velocityY = JUMP_VELOCITY
      player.isJumping = true
    }
  }

  const checkCollision = (player: Player, obstacle: Obstacle): boolean => {
    return (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.y < obstacle.y + obstacle.height &&
      player.y + player.height > obstacle.y
    )
  }

  const updateGame = () => {
    const gameState = gameStateRef.current
    const ctx = canvasRef.current?.getContext('2d')
    
    if (!ctx || gameState.isGameOver) return

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, GAME_WIDTH, GAME_HEIGHT)
    if (gameState.isWinterSeason) {
      gradient.addColorStop(0, '#475569')
      gradient.addColorStop(1, '#64748b')
    } else {
      gradient.addColorStop(0, '#e0f2fe')
      gradient.addColorStop(1, '#dbeafe')
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    
    // Draw rain effect during winter season
    if (gameState.isWinterSeason) {
      ctx.strokeStyle = 'rgba(200, 220, 255, 0.6)'
      ctx.lineWidth = 2
      gameState.raindrops.forEach(raindrop => {
        ctx.beginPath()
        ctx.moveTo(raindrop.x, raindrop.y)
        ctx.lineTo(raindrop.x - 2, raindrop.y + raindrop.length)
        ctx.stroke()
        
        // Update raindrop position
        raindrop.y += raindrop.speed
        raindrop.x -= 2
        
        // Reset raindrop if it goes off screen
        if (raindrop.y > GAME_HEIGHT) {
          raindrop.y = -raindrop.length
          raindrop.x = Math.random() * (GAME_WIDTH + 100)
        }
        if (raindrop.x < -10) {
          raindrop.x = GAME_WIDTH + 10
        }
      })
    }

    // Draw ground with gradient
    const groundGradient = ctx.createLinearGradient(0, GAME_HEIGHT - GROUND_HEIGHT, 0, GAME_HEIGHT)
    groundGradient.addColorStop(0, '#94a3b8')
    groundGradient.addColorStop(1, '#64748b')
    ctx.fillStyle = groundGradient
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT)
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT)
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT)
    ctx.stroke()

    // Update player
    const player = gameState.player
    player.velocityY += GRAVITY
    player.y += player.velocityY

    // Ground collision
    if (player.y >= PLAYER_Y) {
      player.y = PLAYER_Y
      player.velocityY = 0
      player.isJumping = false
    }

    // Draw doctor on scooter using image
    if (doctorImageLoaded && doctorImageRef.current) {
      ctx.drawImage(doctorImageRef.current, player.x - 10, player.y, 80, 100)
    } else {
      // Fallback to blue rectangle if image not loaded
      ctx.fillStyle = '#2055FF'
      ctx.beginPath()
      ctx.roundRect(player.x, player.y, player.width, player.height, 10)
      ctx.fill()
      
      // Draw badge/clipboard on player
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.roundRect(player.x + 10, player.y + 10, 30, 20, 5)
      ctx.fill()
      ctx.fillStyle = '#2055FF'
      ctx.font = 'bold 16px Arial'
      ctx.fillText('📋', player.x + 15, player.y + 26)
    }

    // Update obstacles
    gameState.obstacles = gameState.obstacles.filter(obstacle => {
      obstacle.x += obstacle.velocityX
      
      // Update resignation Y position (flapping motion)
      if (obstacle.type === 'resignation' && obstacle.velocityY !== undefined) {
        obstacle.y += Math.sin(Date.now() * 0.003) * 2
      }

      // Remove off-screen obstacles
      return obstacle.x + obstacle.width > 0
    })

    // Create new obstacles
    const lastObstacle = gameState.obstacles[gameState.obstacles.length - 1]
    if (!lastObstacle || GAME_WIDTH - lastObstacle.x > MIN_OBSTACLE_DISTANCE + Math.random() * (MAX_OBSTACLE_DISTANCE - MIN_OBSTACLE_DISTANCE)) {
      gameState.obstacles.push(createObstacle())
    }

    // Draw obstacles
    gameState.obstacles.forEach(obstacle => {
      if (obstacle.type === 'pit') {
        // Check if this is a sick leave obstacle
        if (obstacle.label === 'Sick Leave' && sickLeaveImageLoaded && sickLeaveImageRef.current) {
          // Draw sick leave doctor image
          ctx.drawImage(sickLeaveImageRef.current, obstacle.x - 10, obstacle.y - 60, 80, 93)
        } else {
          // Draw regular pit with rounded corners
          ctx.fillStyle = '#1e293b'
          ctx.beginPath()
          ctx.roundRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 8)
          ctx.fill()
          
          // Draw label with better styling
          if (obstacle.label) {
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(obstacle.label, obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2 + 4)
          }
        }
      } else {
        // Draw resignation email using image
        if (imageLoaded && resignationImageRef.current) {
          ctx.drawImage(resignationImageRef.current, obstacle.x, obstacle.y, obstacle.width, obstacle.height)
        } else {
          // Fallback to drawing if image not loaded
          ctx.fillStyle = '#ef4444'
          ctx.beginPath()
          ctx.roundRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 8)
          ctx.fill()
          
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('I QUIT', obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2 + 5)
        }
      }
      
      // Check collision
      if (checkCollision(player, obstacle)) {
        gameState.isGameOver = true
      }
    })

    // Update score
    gameState.score += 1
    
    // Check for winter season trigger
    if (!gameState.isWinterSeason && gameState.score >= WINTER_SEASON_SCORE) {
      gameState.isWinterSeason = true
      gameState.raindrops = initializeRaindrops()
    }
    
    // Update game speed
    if (gameState.isWinterSeason) {
      gameState.gameSpeed += WINTER_SPEED_MULTIPLIER
    } else {
      gameState.gameSpeed += SPEED_INCREMENT
    }

    // Draw score with modern styling
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Score: ${Math.floor(gameState.score / 10)}`, 20, 35)
    ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillStyle = '#64748b'
    ctx.fillText(`High Score: ${highScore}`, 20, 65)
    
    // Draw winter season banner
    if (gameState.isWinterSeason) {
      // Animate banner down
      if (gameState.winterBannerY < 0) {
        gameState.winterBannerY += BANNER_ANIMATION_SPEED
      }
      
      // Draw banner
      const bannerGradient = ctx.createLinearGradient(0, gameState.winterBannerY, 0, gameState.winterBannerY + BANNER_HEIGHT)
      bannerGradient.addColorStop(0, 'rgba(30, 64, 175, 0.95)')
      bannerGradient.addColorStop(1, 'rgba(37, 99, 235, 0.95)')
      ctx.fillStyle = bannerGradient
      ctx.fillRect(0, gameState.winterBannerY, GAME_WIDTH, BANNER_HEIGHT)
      
      // Draw banner text
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('WINTER SEASON', GAME_WIDTH / 2, gameState.winterBannerY + BANNER_HEIGHT / 2 + 10)
      
      // Draw snowflakes on banner
      ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText('❄️', GAME_WIDTH / 2 - 150, gameState.winterBannerY + BANNER_HEIGHT / 2 + 8)
      ctx.fillText('❄️', GAME_WIDTH / 2 + 150, gameState.winterBannerY + BANNER_HEIGHT / 2 + 8)
    }

    // Game over
    if (gameState.isGameOver) {
      // Game over overlay with gradient
      const overlayGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
      overlayGradient.addColorStop(0, 'rgba(30, 41, 59, 0.9)')
      overlayGradient.addColorStop(1, 'rgba(51, 65, 85, 0.9)')
      ctx.fillStyle = overlayGradient
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      
      // Calculate days late and penalties
      const playerScore = Math.floor(gameState.score / 10)
      const daysLate = Math.floor((5000 - playerScore) / 100)
      const penalties = 50000 - playerScore
      
      // Game over text
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`Your roster was published ${daysLate} days late.`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60)
      ctx.fillText(`It cost the hospital $${penalties.toLocaleString()} extra in penalties.`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20)
      
      // Call to action
      ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillStyle = '#60a5fa'
      ctx.fillText('Learn better rostering at', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30)
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillStyle = '#3b82f6'
      ctx.fillText('www.rosterlab.com', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 65)
      
      // Restart prompt
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('Press SPACE to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110)
      
      if (playerScore > highScore) {
        setHighScore(playerScore)
      }
    }
  }

  const gameLoop = () => {
    updateGame()
    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }

  const startGame = () => {
    gameStateRef.current = {
      player: {
        x: PLAYER_X,
        y: PLAYER_Y,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        velocityY: 0,
        isJumping: false
      },
      obstacles: [],
      score: 0,
      highScore: highScore,
      isGameOver: false,
      gameSpeed: INITIAL_GAME_SPEED,
      isWinterSeason: false,
      winterBannerY: -BANNER_HEIGHT,
      raindrops: []
    }
    setIsRunning(true)
  }

  useEffect(() => {
    // Load resignation email image
    const img = new Image()
    img.onload = () => {
      setImageLoaded(true)
      console.log('Resignation image loaded successfully')
    }
    img.onerror = (error) => {
      console.error('Failed to load resignation image:', error)
      setImageLoaded(false)
    }
    img.src = '/images/resignation-email.svg'
    resignationImageRef.current = img

    // Load doctor scooter image
    const doctorImg = new Image()
    doctorImg.onload = () => {
      setDoctorImageLoaded(true)
      console.log('Doctor image loaded successfully')
    }
    doctorImg.onerror = (error) => {
      console.error('Failed to load doctor image:', error)
      setDoctorImageLoaded(false)
    }
    doctorImg.src = '/images/doctor-scooter.svg'
    doctorImageRef.current = doctorImg

    // Load sick leave image
    const sickLeaveImg = new Image()
    sickLeaveImg.onload = () => {
      setSickLeaveImageLoaded(true)
      console.log('Sick leave image loaded successfully')
    }
    sickLeaveImg.onerror = (error) => {
      console.error('Failed to load sick leave image:', error)
      setSickLeaveImageLoaded(false)
    }
    sickLeaveImg.src = '/images/sick-leave.svg'
    sickLeaveImageRef.current = sickLeaveImg

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (!isRunning || gameStateRef.current.isGameOver) {
          startGame()
        } else {
          handleJump()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isRunning, highScore])

  useEffect(() => {
    if (isRunning) {
      gameLoop()
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [isRunning])

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="rounded-xl shadow-inner"
          onClick={() => !isRunning ? startGame() : handleJump()}
        />
      </div>
      <div className="mt-6 text-center">
        <p className="text-gray-700 font-semibold text-lg">Press SPACE or click to jump</p>
        <p className="text-gray-500 text-sm mt-2">Avoid resignations and scheduling obstacles!</p>
        <div className="mt-4 flex justify-center gap-8">
          <div className="text-center">
            <div className="w-16 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg mb-2 flex items-center justify-center">
              <span className="text-white font-bold text-xs">I QUIT</span>
            </div>
            <p className="text-xs text-gray-600">Resignation</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-10 bg-gray-800 rounded-lg mb-2 flex items-center justify-center">
              <span className="text-white font-bold text-xs">Exam</span>
            </div>
            <p className="text-xs text-gray-600">Obstacles</p>
          </div>
        </div>
      </div>
    </div>
  )
}