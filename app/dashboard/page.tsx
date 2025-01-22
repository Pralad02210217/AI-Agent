import { BotIcon } from 'lucide-react'
import React from 'react'

const Dashboard = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
    <div className="relative max-w-2xl w-full">
      {/* Decorative elements */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-gray-100 to-gray-50/50 rounded-3xl"></div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f5f5f5_1px,transparent_1px),linear-gradient(to_bottom,#f5f5f5_1px,transparent_1px)] bg-[size:4rem_4rem] rounded-3xl"></div>

      <div className="relative space-y-6 p-8 text-center">
        <div className="bg-white/60 backdrop-blur-sm shadow-sm ring-1 ring-gray-200/50 rounded-2xl p-6 space-y-4">
          <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 inline-flex">
            <BotIcon className="w-12 h-12 text-gray-600" />
          </div>
          <h2 className="text-2xl font-semibold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Welcome to the AI Agent Chat
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Start a new conversation or select an existing chat from the
            sidebar. Your AI assistant is ready to help with any task.
          </p>
          <div className="pt-2 flex justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Real-time responses
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Smart assistance
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              Powerful tools
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default Dashboard