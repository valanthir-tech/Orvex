"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertCircle, RefreshCcw } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
    children?: ReactNode
    fallback?: ReactNode
    onReset?: () => void
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo)
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null })
        if (this.props.onReset) {
            this.props.onReset()
        }
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <Card className="border-rose-500/50 shadow-rose-500/5 bg-rose-500/5 h-full flex flex-col items-center justify-center p-6 text-center">
                    <CardContent className="flex flex-col items-center justify-center space-y-4 p-0">
                        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                            <AlertCircle className="h-6 w-6 text-rose-500" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-rose-600">Failed to load module</h3>
                            <p className="text-sm text-muted-foreground w-full max-w-[250px] mx-auto break-words">
                                {this.state.error?.message || "An unexpected error occurred."}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={this.handleReset}
                            className="gap-2 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 text-rose-500"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )
        }

        return this.props.children
    }
}
