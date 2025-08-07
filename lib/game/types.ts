export interface GameObject {
  x: number
  y: number
  width: number
  height: number
}

export interface Player extends GameObject {
  velocityY: number
  isJumping: boolean
}

export interface Obstacle extends GameObject {
  type: 'pit' | 'resignation'
  label?: string
  velocityX: number
  velocityY?: number
}

export interface GameState {
  player: Player
  obstacles: Obstacle[]
  score: number
  highScore: number
  isGameOver: boolean
  gameSpeed: number
  isWinterSeason: boolean
  winterBannerY: number
  raindrops: Raindrop[]
}

export interface Raindrop {
  x: number
  y: number
  speed: number
  length: number
}