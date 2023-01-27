import { useRef, useState, useEffect } from 'react'

const useCanvasDotSelector = (options = {}) => {
    const {
        initBgColor = '#000000',
        initBgImageSrc = '',
        initDots = [],
        dotRadius = 10,
        drawBgImageBox = false,
    } = options
    const canvasRef = useRef(null)
    const [canvasContext, setCanvasContext] = useState(null)
    const [bgImage, setBgImage] = useState(null)
    const [bgImageCoords, setBgImageCoords] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [bgImageBoundingBoxPerimeter, setBgImageBoundingBoxPerimeter] = useState({
        tl: { x: 0, y: 0 }, tr: { x: 0, y: 0 }, bl: { x: 0, y: 0 }, br: { x: 0, y: 0 },
    })
    const [bgImageBoundingBoxCoords, setBgImageBoundingBoxCoords] = useState({
        x: 0, y: 0, width: 0, height: 0,
    })
    const [activeShapeKeys, setActiveShapeKeys] = useState(initDots)
    const [activeDraggingShape, setActiveDraggingShape] = useState(null)
    const [defaultShapes, setDefaultShapes] = useState({
        1: { key: 1, x: 20, y: 20, radius: dotRadius, color: 'red' },
        2: { key: 2, x: 40, y: 40, radius: dotRadius, color: 'green' },
        3: { key: 3, x: 60, y: 60, radius: dotRadius, color: 'blue' },
        4: { key: 4, x: 80, y: 80, radius: dotRadius, color: 'cyan' },
        5: { key: 5, x: 100, y: 100, radius: dotRadius, color: 'magenta' },
        6: { key: 6, x: 120, y: 120, radius: dotRadius, color: 'yellow' },
    })
    const [zoomScale, setZoomScale] = useState(1)
    const [zoomInitialDistance, setZoomInitialDistance] = useState(0)
    const [zoomCurrentDistance, setZoomCurrentDistance] = useState(0)
    const [imageMoveStartCoords, setImageMoveStartCoords] = useState({ x: 0, y: 0 })
    const [imageMoveEndCoords, setImageMoveEndCoords] = useState({ x: 0, y: 0 })
    const [imageMoveOffsetCoords, setImageMoveOffsetCoords] = useState({ x: 0, y: 0 })
    const [imageMoveDragging, setImageMoveDragging] = useState(false)
    const [shapes, setShapes] = useState({})
    const [shapesArr, setShapesArr] = useState([])
    const [trackingShapes, setTrackingShapes] = useState({})

    const handleMouseTouchShapeHitDetect = (mx, my, shape) => {
        if (shape.radius) {
            let dx = mx - shape.x
            let dy = my - shape.y
            return (dx * dx + dy * dy) < (shape.radius + 10) * (shape.radius + 10)
        }
        return false
    }

    const handleMouseTouchInsideBgImageBoundingBoxHitDetect = (mx, my) => {
        const { tl, tr, bl } = bgImageBoundingBoxPerimeter
        return (mx >= tl.x + dotRadius && mx <= tr.x - dotRadius && my >= tl.y + dotRadius && my <= bl.y - dotRadius)
    }

    const handleMouseWheelZoom = (e) => {
        let zoom = zoomScale
        const { deltaY: delta } = e
        if (delta > 0) {
            zoom -= 0.1
        } else {
            zoom += 0.1
        }
        const clampedZoomScale = Math.min(Math.max(zoom, 1), 4)
        setZoomScale(clampedZoomScale)
        drawCanvas()
    }

    const handleTouchPinchZoomStart = (e) => {
        if (e.touches.length === 2) {
            const { clientX: x1, clientY: y1 } = e.touches[0]
            const { clientX: x2, clientY: y2 } = e.touches[1]

            // Get the initial distance between touch points
            const dx = x2 - x1
            const dy = y2 - y1
            const initialDistance = Math.sqrt(dx * dx + dy * dy)
            setZoomInitialDistance(initialDistance)
        }
    }

    const handleTouchPinchZoomMove = (e) => {
        if (e.touches.length === 2) {
            const { clientX: x1, clientY: y1 } = e.touches[0]
            const { clientX: x2, clientY: y2 } = e.touches[1]

            // Get the current distance between touch points
            const dx = x2 - x1
            const dy = y2 - y1
            const currentDistance = Math.sqrt(dx * dx + dy * dy)
            setZoomCurrentDistance(currentDistance)

            // Calculate change in distance and update zoom level
            const delta = currentDistance - zoomInitialDistance
            const currentZoomScale = zoomScale + (delta * 0.0005)

            // Clamp zoom scale to min and max value
            const clampedZoomScale = Math.min(Math.max(currentZoomScale, 1), 4)
            setZoomScale(clampedZoomScale)
            drawCanvas()
        }
    }

    const handleMouseTouchMoveImageStart = (e) => {
        setImageMoveDragging(true)
        if (e.type === 'touchstart' && e.touches.length === 1) {
            const { clientX: x, clientY: y } = e.touches[0]
            setImageMoveStartCoords({ x, y })
        } else {
            e.stopPropagation()
            const { pageX: x, pageY: y } = e
            setImageMoveStartCoords({ x, y })
        }
    }

    const handleMouseTouchMoveImageEnd = (e) => {
        setImageMoveDragging(false)
        const { x: offsetX, y: offsetY } = imageMoveOffsetCoords
        const dx = offsetX
        const dy = offsetY
        setImageMoveEndCoords({ x: dx, y: dy })
    }

    const handleMouseTouchMoveImageMove = (e) => {
        if (canvasRef.current.style.cursor === 'default') {
            canvasRef.current.style.cursor = 'grab'
        }
        if (!imageMoveDragging || activeDraggingShape || zoomScale <= 1) return
        let mx, my, dx, dy
        if (e.type === 'touchstart' && e.touches.length === 1) {
            const touch = e.touches[0]
            mx = touch.pageX - e.target.offsetLeft
            my = touch.pageY - e.target.offsetTop
            const { clientX: x, clientY: y } = touch
            const { x: startX, y: startY } = imageMoveStartCoords
            dx = x - startX + imageMoveEndCoords.x
            dy = y - startY + imageMoveEndCoords.y

        } else {
            e.stopPropagation()
            mx = e.pageX - e.target.offsetLeft
            my = e.pageY - e.target.offsetTop
            const { pageX: x, pageY: y } = e
            const { x: startX, y: startY } = imageMoveStartCoords
            dx = x - startX + imageMoveEndCoords.x
            dy = y - startY + imageMoveEndCoords.y
        }

        // Keep movement of image within bounds of bounding box
        const { width: bgImageW, height: bgImageH } = bgImageCoords
        const { width: bgBoundW, height: bgBoundH } = bgImageBoundingBoxCoords
        if (dx >= 0 && bgImageW >= bgBoundW) {
            dx = 0
        } else if (dx <= imageMoveOffsetCoords.x && bgImageW >= bgBoundW && bgImageW - bgBoundW <= Math.abs(imageMoveOffsetCoords.x)) {
            const stopXPad = Math.abs(Math.abs((bgImageW - bgBoundW)) - Math.abs(imageMoveOffsetCoords.x))
            dx = imageMoveOffsetCoords.x + stopXPad
        }
        if (dy >= 0 && bgImageH >= bgBoundH) {
            dy = 0
        } else if (dy <= imageMoveOffsetCoords.y && bgImageH >= bgBoundH && bgImageH - bgBoundH <= Math.abs(imageMoveOffsetCoords.y)) {
            const stopYPad = Math.abs(Math.abs((bgImageH - bgBoundH)) - Math.abs(imageMoveOffsetCoords.y))
            dy = imageMoveOffsetCoords.y + stopYPad
        }


        // Set offset coords and redraw the canvas
        setImageMoveOffsetCoords({ x: dx, y: dy })
        const isMoveWithinBounds = handleMouseTouchInsideBgImageBoundingBoxHitDetect(mx, my)
        if (!isMoveWithinBounds) return false
        drawCanvas()
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
            if (handleMouseTouchShapeHitDetect(mx, my, shape)) {
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
        if (canvasRef.current.style.cursor === 'move') {
            canvasRef.current.style.cursor = 'move'
        }
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
                if (handleMouseTouchShapeHitDetect(mmx, mmy, shape)) {
                    canvasRef.current.style.cursor = 'move'
                    break
                } else {
                    canvasRef.current.style.cursor = 'default'
                }
            }
        }
        const isMoveWithinBounds = handleMouseTouchInsideBgImageBoundingBoxHitDetect(mx, my)
        if (!activeDraggingShape || !isMoveWithinBounds) return false
        if (isMoveWithinBounds) {
            let dx = mx - activeDraggingShape.x
            let dy = my - activeDraggingShape.y
            activeDraggingShape.x += dx
            activeDraggingShape.y += dy
            drawCanvas()
        }
    }

    const loadImageIntoCanvas = (imageSrc) => {
        const bgImage = new Image()
        bgImage.src = imageSrc
        setBgImage(bgImage)
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
        const { shapesOverride, ctx = canvasContext } = options
        let shapesArrInit = shapesArr
        if (ctx) {

            // Get canvas dimensions with device scale
            const { devicePixelRatio:ratio=1 } = window
            const canvasElmWidth = ctx.canvas.width / ratio
            const canvasElmHeight = ctx.canvas.height / ratio

            // Scale image to maintain its aspect ratio with its height equal to the canvas height
            const aspectRatio = bgImage.width / bgImage.height
            const newImgWidth = canvasElmHeight * aspectRatio
            const newImgHeight = canvasElmHeight
            bgImage.width = newImgWidth
            bgImage.height = newImgHeight

            // Get coordinates to center the image inside the canvas
            const x = (canvasElmWidth - newImgWidth) / 2
            const y = (canvasElmHeight - newImgHeight) / 2

            // Set the bounding box coordinates
            setBgImageBoundingBoxPerimeter({
                tl: { x, y: 0 },
                tr: { x: x + newImgWidth, y: 0 },
                bl: { x, y: newImgHeight },
                br: { x: x + newImgWidth, y: newImgHeight },
            })

            // Set the bounding box coordinates
            setBgImageBoundingBoxCoords({
                x: x,
                y: y,
                width: newImgWidth,
                height: newImgHeight
            })

            // Store the background image coordinates
            setBgImageCoords({
                x: imageMoveOffsetCoords.x,
                y: imageMoveOffsetCoords.y,
                width: newImgWidth * zoomScale,
                height: newImgHeight * zoomScale,
            })

            // Use passed shapes parameter to redraw canvas
            if (shapesOverride) {
                shapesArrInit = Object.entries(shapesOverride).map(([key, shape]) => {
                    return { ...shape, x: shape.x + x, y: shape.y }
                })
                setShapesArr(shapesArrInit)
            }

            // Clear canvas before redraw
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

            // Draw rectangle bounding box to clip the background image
            ctx.save()
            ctx.rect(x, 0, newImgWidth, newImgHeight)
            ctx.clip()

            // Draw background image
            ctx.drawImage(bgImage, x + imageMoveOffsetCoords.x, imageMoveOffsetCoords.y, newImgWidth * zoomScale, newImgHeight * zoomScale)
            ctx.restore()

            // Draw a rectangle around the background image that appears 2 pixels thick
            if (drawBgImageBox) {
                ctx.beginPath()
                ctx.moveTo(x - 2, 0)
                ctx.lineTo(x + newImgWidth + 2, 0)
                ctx.lineTo(x + newImgWidth + 2, newImgHeight - 1)
                ctx.lineTo(x - 2, newImgHeight - 1)
                ctx.lineTo(x - 2, -2)
                ctx.strokeStyle = 'white'
                ctx.stroke()
            }

            // Draw shapes
            for (let i = 0; i < shapesArrInit.length; i++) {
                let shape = shapesArrInit[i]
                if (shape.radius) {
                    ctx.beginPath()
                    ctx.arc(shape.x, shape.y, shape.radius + 2, 0, Math.PI * 2)
                    ctx.fillStyle = 'white'
                    ctx.fill()
                    ctx.beginPath()
                    ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2)
                    ctx.fillStyle = shape.color
                    ctx.fill()
                }
            }
            const newTrackingShapes = {}
            shapesArrInit.map((shape) => {
                newTrackingShapes[shape.key] = { ...shape, x: shape.x - x, y: shape.y }
                return { ...shape, x: shape.x - x, y: shape.y }
            })
            setTrackingShapes(newTrackingShapes)
        }
    }

    useEffect(() => {

        // Attach "global" canvas element event listeners
        canvasRef.current.addEventListener('mouseenter', (e) => {
            document.body.style.overflow = 'hidden'
        })
        canvasRef.current.addEventListener('mouseleave', (e) => {
            document.body.style.overflow = 'auto'
        })
    }, [])

    useEffect(() => {

        // Set default styles
        canvasRef.current.style.touchAction = 'none'
        canvasRef.current.style.backgroundColor = initBgColor

        // Load initial background image
        if (initBgImageSrc) loadImageIntoCanvas(initBgImageSrc)

        // Add initial shapes
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

        // Initialize canvas and device pixel density
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        setCanvasContext(context)
        if (canvasContext) {
            resizeCanvas(canvas)
        }

        // Initialize shapes
        if (Object.entries(shapes).length) {
            drawCanvas({ shapesOverride: shapes })
        }
    }, [canvasContext, shapes])

    return {
        canvasRef,
        loadImageIntoCanvas,
        handleMouseTouchDown,
        handleMouseTouchUp,
        handleMouseTouchMove,
        handleTouchPinchZoomStart,
        handleTouchPinchZoomMove,
        handleMouseTouchMoveImageStart,
        handleMouseTouchMoveImageEnd,
        handleMouseTouchMoveImageMove,
        handleMouseWheelZoom,
        setActiveDots: activeShapeKeys => setActiveShapeKeys(activeShapeKeys),
        activeDot: activeDraggingShape,
        dots: trackingShapes,
    }
}

export default useCanvasDotSelector