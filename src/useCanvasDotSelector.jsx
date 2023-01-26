import { useRef, useState, useEffect } from 'react'

const useCanvasDotSelector = (options = {}) => {
    const {
        dotMaxCount = 6,
        dotRadius = 10,
    } = options
    const canvasRef = useRef(null)
    const [curDragX, setCurDragX] = useState(0)
    const [curDragY, setCurDragY] = useState(0)
    const [activeShapeCount, setActiveShapeCount] = useState(0)
    const [activeDraggingShape, setActiveDraggingShape] = useState(null)
    const [defaultShapes, setDefaultShapes] = useState({
        1: { x: 0, y: 0, radius: dotRadius, color: 'red', active: false },
        2: { x: 0, y: 0, radius: dotRadius, color: 'green', active: false },
        3: { x: 0, y: 0, radius: dotRadius, color: 'blue', active: false },
        4: { x: 0, y: 0, radius: dotRadius, color: 'cyan', active: false },
        5: { x: 0, y: 0, radius: dotRadius, color: 'magenta', active: false },
        6: { x: 0, y: 0, radius: dotRadius, color: 'yellow', active: false },
    })
    const [shapes, setShapes] = useState({})
    const [shapesArr, setShapesArr] = useState(Object.entries(shapes).map(([key, value]) => value))

    const handleMouseShapeHitDetect = (mx, my, shape) => {
        if (shape.radius) {
            let dx = mx - shape.x
            let dy = my - shape.y
            return (dx * dx + dy * dy) < shape.radius * shape.radius
        }
        return false
    }

    const handleMouseTouchDown = (e) => {
        let mx, my
        if (e.type === 'touchstart' && e.touches.length === 1) {
            let touch = e.touches[0]
            mx = touch.pageX - e.target.offsetLeft
            my = touch.pageY - e.target.offsetTop
        } else {
            e.stopPropagation()
            mx = e.pageX - e.target.offsetLeft
            my = e.pageY - e.target.offsetTop
        }
        for (let i = 0; i < shapesArr.length; i++) {
            let shape = shapesArr[i]
            if (handleMouseShapeHitDetect(mx, my, shape)) {
                canvasRef.current.style.cursor = 'move'

                // Move 'shape' to the end of the array (top of the stack)
                shapesArr.splice(i, 1)
                shapesArr.push(shape)
                setShapesArr(shapesArr)

                // Set the active shape and its coordinates
                setActiveDraggingShape(shape)
                break
            }
        }
    }

    const handleMouseTouchUp = (e) => {
        canvasRef.current.style.cursor = 'default'
        if (!activeDraggingShape) return
        setActiveDraggingShape(null)
    }

    const handleMouseTouchMove = (e) => {
        let mx, my, mmx, mmy
        if (e.type === 'touchmove' && e.touches.length === 1) {
            let touch = e.touches[0]
            mx = touch.pageX - e.target.offsetLeft
            my = touch.pageY - e.target.offsetTop
        } else {
            mx = mmx = e.pageX - e.target.offsetLeft
            my = mmy = e.pageY - e.target.offsetTop
            for (let i = 0; i < shapesArr.length; i++) {
                let shape = shapesArr[i]
                if (handleMouseShapeHitDetect(mmx, mmy, shape)) {
                    canvasRef.current.style.cursor = 'move'
                    break
                } else {
                    canvasRef.current.style.cursor = 'default'
                }
            }
        }
        if (!activeDraggingShape) return
        setCurDragX(mx)
        setCurDragY(my)
        let dx = mx - activeDraggingShape.x
        let dy = my - activeDraggingShape.y
        activeDraggingShape.x += dx
        activeDraggingShape.y += dy
    }

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

    const drawCanvas = (canvas, context) => {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height)
        for (let i = 0; i < shapesArr.length; i++) {
            let shape = shapesArr[i]
            if (shape.radius) {
                context.beginPath()
                context.arc(shape.x, shape.y, shape.radius + 2, 0, Math.PI * 2)
                context.fillStyle = 'white'
                context.fill()
                context.beginPath()
                context.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2)
                context.fillStyle = shape.color
                context.fill()
            }
        }
    }

    useEffect(() => {
        canvasRef.current.style.touchAction = 'none'
    }, [canvasRef])

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        resizeCanvas(canvas, context)
        drawCanvas(canvas, context)
    }, [drawCanvas])

    return {
        handleMouseTouchDown,
        handleMouseTouchUp,
        handleMouseTouchMove,
        canvasRef,
        activeDot: activeDraggingShape,
    }
}

export default useCanvasDotSelector