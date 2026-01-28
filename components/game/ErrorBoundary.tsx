'use client'
import React from 'react'

type ErrorBoundaryState = { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Game render error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
          <div className="max-w-xl text-center space-y-4">
            <div className="text-2xl text-red-400 font-semibold">渲染失败 / Render Error</div>
            <div className="text-sm text-gray-300">
              {this.state.message || 'Unknown error'}
            </div>
            <div className="text-xs text-gray-500">
              请打开浏览器控制台查看详细错误信息。
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
