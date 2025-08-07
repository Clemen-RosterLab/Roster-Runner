'use client'

import Game from '@/components/game/Game'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="w-full max-w-4xl px-4">
        <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          Roster Runner
        </h1>
        <p className="text-center text-gray-600 mb-6 text-lg">
          Navigate the challenges of hospital scheduling
        </p>
        <Game />
      </div>
    </main>
  )
}