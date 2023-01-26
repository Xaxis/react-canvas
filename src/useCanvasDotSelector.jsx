import { useRef, useState, useEffect } from 'react'

const useCanvasDotSelector = (options = {}) => {
    const {
        initBgColor = '#000000',
        initBgImageSrc = '',
        initDots = [],
        dotMaxCount = 6,
        dotRadius = 10,
    } = options
    const canvasRef = useRef(null)
    const [canvasContext, setCanvasContext] = useState(null)
    const [backgroundImage, setBackgroundImage] = useState(null)
    const [activeShapeCount, setActiveShapeCount] = useState(0)
    const [activeShapeKeys, setActiveShapeKeys] = useState(initDots)
    const [activeDraggingShape, setActiveDraggingShape] = useState(null)
    const [defaultShapes, setDefaultShapes] = useState({
        1: { x: 20, y: 20, radius: dotRadius, color: 'red', added: false },
        2: { x: 40, y: 40, radius: dotRadius, color: 'green', added: false },
        3: { x: 60, y: 60, radius: dotRadius, color: 'blue', added: false },
        4: { x: 80, y: 80, radius: dotRadius, color: 'cyan', added: false },
        5: { x: 100, y: 100, radius: dotRadius, color: 'magenta', added: false },
        6: { x: 120, y: 120, radius: dotRadius, color: 'yellow', added: false },
    })
    const [shapes, setShapes] = useState({})
    const [shapesArr, setShapesArr] = useState([])

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
        let dx = mx - activeDraggingShape.x
        let dy = my - activeDraggingShape.y
        drawCanvas()
        activeDraggingShape.x += dx
        activeDraggingShape.y += dy
    }

    const loadImageIntoCanvas = (imageSrc) => {
        const bgImage = new Image()
        bgImage.src = imageSrc
        setBackgroundImage(bgImage)
        drawCanvas()
    }

    const resizeCanvas = (canvas) => {
        const { width, height } = canvas.getBoundingClientRect()
        if (canvas.width !== width || canvas.height !== height) {
            const { devicePixelRatio:ratio=1 } = window
            canvas.width = width * ratio
            canvas.height = height * ratio
            canvasContext.scale(ratio, ratio)
            return { deltaWidth: width, deltaHeight: height }
        }
        return false
    }

    const drawCanvas = (options = {}) => {
        const { shapesOverride } = options
        let shapesArrInit = shapesArr
        if (shapesOverride) {
            shapesArrInit = Object.entries(shapesOverride).map(([key, value]) => value)
            setShapesArr(shapesArrInit)
        }
        if (canvasContext) {
            canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height)
            if (backgroundImage) {
                const { devicePixelRatio:ratio=1 } = window
                const canvasElmWidth = canvasContext.canvas.width / ratio
                const canvasElmHeight = canvasContext.canvas.height / ratio

                // Scale image to maintain its aspect ratio with its height equal to the canvas height
                const aspectRatio = backgroundImage.width / backgroundImage.height
                const newWidth = canvasElmHeight * aspectRatio
                const newHeight = canvasElmHeight
                backgroundImage.width = newWidth
                backgroundImage.height = newHeight

                // Get coordinates to center the image inside the canvas
                const x = (canvasElmWidth - newWidth) / 2
                canvasContext.drawImage(backgroundImage, x, 0, newWidth, newHeight)
            }
            for (let i = 0; i < shapesArrInit.length; i++) {
                let shape = shapesArrInit[i]
                if (shape.radius) {
                    canvasContext.beginPath()
                    canvasContext.arc(shape.x, shape.y, shape.radius + 2, 0, Math.PI * 2)
                    canvasContext.fillStyle = 'white'
                    canvasContext.fill()
                    canvasContext.beginPath()
                    canvasContext.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2)
                    canvasContext.fillStyle = shape.color
                    canvasContext.fill()
                }
            }
        }
    }

    useEffect(() => {
        if (activeShapeKeys && activeShapeKeys.length) {
            const newShapes = activeShapeKeys.reduce((acc, key) => {
                if (defaultShapes[key]) {
                    acc[key] = defaultShapes[key]
                }
                return acc
            }, {})
            const newShapesKeys = Object.keys(newShapes)
            const shapesKeys = Object.keys(shapes)
            const shapesKeysDiff = newShapesKeys.filter((key) => !shapesKeys.includes(key))
            if (shapesKeysDiff.length) {
                setShapes(newShapes)
            }
        }
    }, [activeShapeKeys])

    useEffect(() => {
        canvasRef.current.style.touchAction = 'none'
        canvasRef.current.style.backgroundColor = initBgColor
        if (initBgImageSrc) loadImageIntoCanvas(initBgImageSrc)
    }, [canvasRef])

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        setCanvasContext(context)
        if (canvasContext) {
            resizeCanvas(canvas)
            drawCanvas()

        }
    }, [canvasContext, shapes])

    useEffect(() => {
        if (Object.entries(shapes).length) {
            drawCanvas({ shapesOverride: shapes })
        }
    }, [shapes])

    return {
        canvasRef,
        loadImageIntoCanvas,
        handleMouseTouchDown,
        handleMouseTouchUp,
        handleMouseTouchMove,
        setActiveDots: activeShapeKeys => setActiveShapeKeys(activeShapeKeys),
        activeDot: activeDraggingShape,
    }
}

export default useCanvasDotSelector