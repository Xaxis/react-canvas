import { useRef, useState, useEffect } from 'react'

const useCanvas = (options = {}) => {
    const { draw, shapes } = options
    const [canvas, setCanvas] = useState(null)
    const canvasRef = useRef(null)

    const resizeCanvas = (canvas, context) => {
        const { width, height } = canvas.getBoundingClientRect()
        if (canvas.width !== width || canvas.height !== height) {
            const { devicePixelRatio:ratio=1 } = window
            canvas.width = width * ratio
            canvas.height = height * ratio
            context.scale(ratio, ratio)
            return { deltaWidth: width, deltaHeight: height }
        }
        return false
    }

    useEffect(() => {
        // document.addEventListener('touchstart', (e) => {
        //     e.preventDefault()
        //     document.body.style.touchAction = 'none'
        // }, { passive: false })
        // document.addEventListener('touchmove', (e) => {
        //     e.preventDefault()
        //     document.body.style.touchAction = 'none'
        // }, { passive: false })
        // if (canvas) {
        //     canvas.onmousedown = ''
        //     canvas.onmouseup = ''
        //     canvas.onmouseout = ''
        //     canvas.onmousemove = ''
        //     canvas.ontouchstart = ''
        //     canvas.ontouchend = ''
        //     canvas.ontouchcancel = ''
        //     canvas.ontouchmove = ''
        // }
    }, [canvas])

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        setCanvas(canvas)
        resizeCanvas(canvas, context)
        draw(context)
    }, [draw, shapes])

    return { canvas, canvasRef }
}

export default useCanvas