import { useRef, useState, useEffect } from 'react'

const useCanvasDotSelector = (options = {}) => {
    const {
        bgColor = '#000000',
        bgImageSrc = '',
        initDots = [],
        dotRadius = 10,
        showGrid = false,
    } = options
    const canvasRef = useRef(null)
    const [resizeScaleRatio, setResizeScaleRatio] = useState({
        x: window.devicePixelRatio=1,
        y: window.devicePixelRatio=1
    })

    const [bgImage, setBgImage] = useState(null)
    const [bgImageLoadSrc, setBgImageLoadSrc] = useState(null)
    const [bgImageCoords, setBgImageCoords] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [bgImageOffsetCoords, setBgImageOffsetCoords] = useState({ x: 0, y: 0 })
    const [bgImageBoundingBoxPerimeter, setBgImageBoundingBoxPerimeter] = useState({
        tl: { x: 0, y: 0 }, tr: { x: 0, y: 0 }, bl: { x: 0, y: 0 }, br: { x: 0, y: 0 },
    })
    const [bgImageBoundingBoxCoords, setBgImageBoundingBoxCoords] = useState({
        x: 0, y: 0, width: 0, height: 0,
    })

    const [zoomScale, setZoomScale] = useState(1)
    const [zoomInitialDistance, setZoomInitialDistance] = useState(0)
    const [zoomCurrentDistance, setZoomCurrentDistance] = useState(0)

    const [imageMoveStartCoords, setImageMoveStartCoords] = useState({ x: 0, y: 0 })
    const [imageMoveEndCoords, setImageMoveEndCoords] = useState({ x: 0, y: 0 })
    const [imageMoveOffsetCoords, setImageMoveOffsetCoords] = useState({ x: 0, y: 0 })
    const [imageMoveDragging, setImageMoveDragging] = useState(false)

    const [shapes, setShapes] = useState({})
    const [defaultShapes, setDefaultShapes] = useState({
        r: { key: 'r', x: 20, y: 20, xx: 0, yy: 0, radius: dotRadius, color: 'red', set: false, show: true },
        g: { key: 'g', x: 40, y: 40, xx: 0, yy: 0, radius: dotRadius, color: 'green', set: false, show: true },
        b: { key: 'b', x: 60, y: 60, xx: 0, yy: 0, radius: dotRadius, color: 'blue', set: false, show: true },
        c: { key: 'c', x: 80, y: 80, xx: 0, yy: 0, radius: dotRadius, color: 'cyan', set: false, show: true },
        m: { key: 'm', x: 100, y: 100, xx: 0, yy: 0, radius: dotRadius, color: 'magenta', set: false, show: true },
        y: { key: 'y', x: 120, y: 120, xx: 0, yy: 0, radius: dotRadius, color: 'yellow', set: false, show: true },
    })
    const [shapesArr, setShapesArr] = useState([])
    const [initialShapeKeys, setInitialShapeKeys] = useState(initDots)
    const [activeDraggingShape, setActiveDraggingShape] = useState(null)
    const [trackingShapes, setTrackingShapes] = useState({})

    const setShapesState = (shapesStateObj) => {
        const newShapes = {}
        Object.entries(shapesStateObj).map(([key, shape]) => {
            newShapes[key] = { ...shapes[key], ...shape }
            return shape
        })
        setShapes(newShapes)
        const newShapesArr = Object.entries(shapesStateObj).map(([key, shape]) => ({ ...shape }))
        setShapesArr(newShapesArr)
        drawCanvas({ shapesArrOverride: newShapesArr })
    }

    const handleMouseTouchShapeHitDetect = (mx, my, shape) => {
        let dx = mx - shape.xx
        let dy = my - shape.yy
        return (dx * dx + dy * dy) < (shape.radius + 10) * (shape.radius + 10)
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
        const clampedZoomScale = Math.min(Math.max(zoom, 1), 6)

        // While zooming out, set imageMoveOffsetCoords closer to 0 the closer clampedZoomScale gets to 1
        // We do this so it stays within the constraints of the bounding box when zooming back out after moving it
        const clampedZoomScaleOffset = (clampedZoomScale - 1) / 6
        const updatedCoords = {
            x: imageMoveOffsetCoords.x * clampedZoomScaleOffset,
            y: imageMoveOffsetCoords.y * clampedZoomScaleOffset
        }

        // Get the mouse position relative to the canvas
        const { clientX: mx, clientY: my } = e
        const { left, top } = canvasRef.current.getBoundingClientRect()
        const x = mx - left
        const y = my - top

        // If mouse isn't inside the bounding box, don't zoom
        if (!handleMouseTouchInsideBgImageBoundingBoxHitDetect(x, y)) {
            document.body.style.overflow = 'auto'
            return false
        } else {
            document.body.style.overflow = 'hidden'
        }

        // Zoom centered around the mouse position
        updatedCoords.x += (x - (x * clampedZoomScale)) / clampedZoomScale
        updatedCoords.y += (y - (y * clampedZoomScale)) / clampedZoomScale

        // Update state
        setZoomScale(clampedZoomScale)
        setImageMoveOffsetCoords(updatedCoords)
        setImageMoveEndCoords(updatedCoords)
        drawCanvas({
            zoomScaleOverride: clampedZoomScale,
        })
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
            const clampedZoomScale = Math.min(Math.max(currentZoomScale, 1), 6)
            const clampedZoomScaleOffset = (clampedZoomScale - 1) / 6
            const updatedCoords = {
                x: imageMoveOffsetCoords.x * clampedZoomScaleOffset,
                y: imageMoveOffsetCoords.y * clampedZoomScaleOffset
            }

            // Get the touch point positions relative to the canvas
            const { left, top } = canvasRef.current.getBoundingClientRect()
            const x1Canvas = x1 - left
            const y1Canvas = y1 - top
            const x2Canvas = x2 - left
            const y2Canvas = y2 - top

            // Get the average of the two touch points
            const x = (x1Canvas + x2Canvas) / 2
            const y = (y1Canvas + y2Canvas) / 2

            // Zoom centered around the average of the two touch points
            updatedCoords.x += (x - (x * clampedZoomScale)) / clampedZoomScale
            updatedCoords.y += (y - (y * clampedZoomScale)) / clampedZoomScale

            // Update state
            setImageMoveOffsetCoords(updatedCoords)
            setImageMoveEndCoords(updatedCoords)
            setZoomScale(clampedZoomScale)
            drawCanvas({ zoomScaleOverride: clampedZoomScale })
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
        let mx, my, dx, dy
        if (e.type === 'touchmove' && e.touches.length === 1) {
            const touch = e.touches[0]
            mx = touch.pageX - e.target.offsetLeft
            my = touch.pageY - e.target.offsetTop
            const { clientX: x, clientY: y } = touch
            const { x: startX, y: startY } = imageMoveStartCoords
            dx = x - startX + imageMoveEndCoords.x
            dy = y - startY + imageMoveEndCoords.y
        } else {
            mx = e.pageX - e.target.offsetLeft
            my = e.pageY - e.target.offsetTop
            const { pageX: x, pageY: y } = e
            const { x: startX, y: startY } = imageMoveStartCoords
            dx = x - startX + imageMoveEndCoords.x
            dy = y - startY + imageMoveEndCoords.y
        }

        // Perform bg image bounding box check
        const isMoveWithinBounds = handleMouseTouchInsideBgImageBoundingBoxHitDetect(mx, my)

        if (canvasRef.current.style.cursor === 'default' && isMoveWithinBounds) {
            canvasRef.current.style.cursor = 'grab'
        } else if (!isMoveWithinBounds) {
            canvasRef.current.style.cursor = 'not-allowed'
        }

        // Cancel event checks
        if (!imageMoveDragging || activeDraggingShape || zoomScale <= 1 || !isMoveWithinBounds) return false

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
        drawCanvas()
        setImageMoveOffsetCoords({ x: dx, y: dy })
    }

    const handleMouseTouchMoveDotStart = (e) => {
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

        // Check if mouse is inside a shape
        for (let i = 0; i < shapesArr.length; i++) {
            let shape = shapesArr[i]
            if (handleMouseTouchShapeHitDetect(mx, my, shape)) {
                canvasRef.current.style.cursor = 'move'

                // Move 'shape' to the end of the array (top of the stack)
                shapesArr.splice(i, 1)
                shapesArr.push(shape)
                setShapesArr([...shapesArr])

                // Set the active shape and its coordinates
                shape.set = false
                setActiveDraggingShape(shape)
                break
            }
        }
    }

    const handleMouseTouchMoveDotEnd = (e) => {
        e.stopPropagation()
        if (canvasRef.current.style.cursor === 'move') {
            canvasRef.current.style.cursor = 'move'
        }
        if (!activeDraggingShape) return
        activeDraggingShape.set = true
        setActiveDraggingShape(null)
        drawCanvas({ bgImageFilterOff: true })
    }

    const handleMouseTouchMoveDotMove = (e) => {
        let mx, my
        if (e.type === 'touchmove' && e.touches.length === 1) {
            let touch = e.touches[0]
            mx = touch.pageX - e.target.offsetLeft
            my = touch.pageY - e.target.offsetTop
        } else {
            e.preventDefault()
            e.stopPropagation()
            mx = e.pageX - e.target.offsetLeft
            my = e.pageY - e.target.offsetTop
            for (let i = 0; i < shapesArr.length; i++) {
                let shape = shapesArr[i]
                if (handleMouseTouchShapeHitDetect(mx, my, shape)) {
                    canvasRef.current.style.cursor = 'move'
                    break
                } else {
                    canvasRef.current.style.cursor = 'default'
                }
            }
        }

        // Only proceed if within bounding box
        const isMoveWithinBounds = handleMouseTouchInsideBgImageBoundingBoxHitDetect(mx, my)
        if (!activeDraggingShape || !isMoveWithinBounds) return false

        // Set shape coordinates
        activeDraggingShape.x = (mx - bgImageOffsetCoords.x - imageMoveOffsetCoords.x) / zoomScale
        activeDraggingShape.y = (my - bgImageOffsetCoords.y - imageMoveOffsetCoords.y) / zoomScale
        drawCanvas()
    }

    const drawCanvas = (options = {}) => {
        const {
            shapesArrOverride = shapesArr,
            zoomScaleOverride = zoomScale,
            bgImageFilterOff = false
        } = options
        const ctx = canvasRef.current.getContext('2d', { alpha: false })
        if (ctx && bgImage) {

            // Get canvas dimensions
            const canvasElmWidth = ctx.canvas.width / resizeScaleRatio.x
            const canvasElmHeight = ctx.canvas.height / resizeScaleRatio.y

            // Scale image dimensions to fit within the browser window width and maintain aspect ratio
            let aspectRatio = bgImage.width / bgImage.height
            let newImgWidth = canvasElmWidth
            let newImgHeight = canvasElmWidth / aspectRatio

            // Prevent image height from exceeding the canvas height
            if (newImgHeight > canvasElmHeight) {
                newImgWidth = canvasElmHeight * aspectRatio
                newImgHeight = canvasElmHeight
            }

            // Get coordinates of the centered bg image inside the canvas. These are used to track the offsets for the
            // start of the relative coordinate system
            const bgImgOffsX = Math.floor((canvasElmWidth - newImgWidth) / 2)
            const bgImgOffsY = Math.floor((canvasElmHeight - newImgHeight) / 2)
            setBgImageOffsetCoords({ x: bgImgOffsX, y: bgImgOffsY })

            // Set the bounding box coordinates
            setBgImageBoundingBoxPerimeter({
                tl: { x: bgImgOffsX, y: bgImgOffsY },
                tr: { x: bgImgOffsX + newImgWidth, y: bgImgOffsY },
                bl: { x: bgImgOffsX, y: bgImgOffsY + newImgHeight },
                br: { x: bgImgOffsX + newImgWidth, y: bgImgOffsY + newImgHeight },
            })

            // Set the bounding box coordinates
            setBgImageBoundingBoxCoords({
                x: bgImgOffsX,
                y: bgImgOffsY,
                width: newImgWidth,
                height: newImgHeight
            })

            // Store the background image coordinates
            setBgImageCoords({
                x: imageMoveOffsetCoords.x,
                y: imageMoveOffsetCoords.y,
                width: newImgWidth * zoomScaleOverride,
                height: newImgHeight * zoomScaleOverride,
            })

            // Get coordinate box for bg image
            const bgImgX = bgImgOffsX + imageMoveOffsetCoords.x
            const bgImgY = bgImgOffsY + imageMoveOffsetCoords.y
            const bgImgWidth = newImgWidth * zoomScaleOverride
            const bgImgHeight = newImgHeight * zoomScaleOverride

            // Clear canvas before redraw
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

            // Clip to the bg image "bounding box"
            ctx.save()
            ctx.rect(bgImgOffsX, bgImgOffsY, newImgWidth, newImgHeight)
            ctx.clip()

            // Assign bg image coordinate space and draw the background image
            if (activeDraggingShape && !bgImageFilterOff) ctx.filter = 'saturate(0.2)'
            ctx.drawImage(bgImage, Math.floor(bgImgX), Math.floor(bgImgY), Math.floor(bgImgWidth), Math.floor(bgImgHeight))
            ctx.filter = 'none'

            // Draw a grid over the background image that accounts for the zoom scale override and image move offset
            if (showGrid) {
                ctx.strokeStyle = 'rgba(255, 20, 147, 0.75)'
                ctx.lineWidth = 1
                for (let i = 0; i < bgImgWidth; i += 50) {
                    ctx.beginPath()
                    ctx.moveTo(Math.floor(bgImgX + i), Math.floor(bgImgY))
                    ctx.lineTo(Math.floor(bgImgX + i), Math.floor(bgImgY + bgImgHeight))
                    ctx.stroke()
                }
                for (let i = 0; i < bgImgHeight; i += 50) {
                    ctx.beginPath()
                    ctx.moveTo(Math.floor(bgImgX), Math.floor(bgImgY + i))
                    ctx.lineTo(Math.floor(bgImgX + bgImgWidth), Math.floor(bgImgY + i))
                    ctx.stroke()
                }

                // Draw box used to display the grid coordinates
                const xInfoBoxCoord = activeDraggingShape ? activeDraggingShape.x : 0
                const yInfoBoxCoord = activeDraggingShape ? activeDraggingShape.y : 0
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.fillRect(Math.floor(bgImgOffsX), Math.floor(bgImgOffsY), 100, 20)
                ctx.fillStyle = 'white'
                ctx.font = '12px Arial'
                ctx.fillText(`x: ${Math.floor(xInfoBoxCoord)}, y: ${Math.floor(yInfoBoxCoord)}`, Math.floor(bgImgOffsX + 5), Math.floor(bgImgOffsY + 15))
            }

            // Draw shapes ("dots")
            for (let i = 0; i < shapesArrOverride.length; i++) {
                let shape = shapesArrOverride[i]

                // Hide shape if set to hidden
                if (!shape.show) continue

                // Set outer glow of active shape
                if (activeDraggingShape && activeDraggingShape.key === shape.key) {
                    ctx.shadowBlur = 10
                    ctx.shadowColor = '#FFFF33'
                }

                // Set opacity of set circles
                if (shape.set) {
                    ctx.globalAlpha = 0.5
                    ctx.shadowBlur = 0
                    ctx.shadowColor = 'transparent'
                }

                // Set shape coordinates relative to the background image coordinates and zoom scale
                let shapeX = shape.xx = Math.floor((shape.x * zoomScaleOverride) + bgImgOffsX + imageMoveOffsetCoords.x)
                let shapeY = shape.yy = Math.floor((shape.y * zoomScaleOverride) + bgImgOffsY + imageMoveOffsetCoords.y)

                // Draw circle (outline)
                ctx.beginPath()
                ctx.arc(shapeX, shapeY, shape.radius + 2, 0, Math.PI * 2)
                ctx.fillStyle = 'white'
                ctx.fill()

                // Draw circle (dot)
                ctx.beginPath()
                ctx.arc(shapeX, shapeY, shape.radius, 0, Math.PI * 2)
                ctx.fillStyle = shape.color
                ctx.fill()

                // Hack - For unknown reasons, the last shape is not clipped. This is a workaround adding a transparent
                // context change as a non-existent last shape to solve for this issue.
                if (i === shapesArrOverride.length - 1) {
                    ctx.beginPath()
                    ctx.fillStyle = 'transparent'
                    ctx.fill()
                }

                // Set opacity back to 1
                ctx.globalAlpha = 1
            }

            // Restore after drawing shapes
            ctx.restore()

            // Update tracking shapes
            const newTrackingShapes = {}
            shapesArrOverride.map((shape) => {
                newTrackingShapes[shape.key] = {
                    ...shape,
                    xp: Math.round((shape.x / newImgWidth) * 10000) / 10000,
                    yp: Math.round((shape.y / newImgHeight) * 10000) / 10000,
                }
                return shape
            })
            setTrackingShapes(newTrackingShapes)
        }
    }

    const resizeCanvas = () => {
        const ctx = canvasRef.current.getContext('2d', { alpha: false })
        const { width, height } = canvasRef.current.getBoundingClientRect()
        const { devicePixelRatio:ratio=1 } = window
        if (canvasRef.current.width !== width || canvasRef.current.height !== height) {
            canvasRef.current.width = width * ratio
            canvasRef.current.height = height * ratio
            setResizeScaleRatio({ x: ratio, y: ratio })
            ctx.scale(ratio, ratio)
        }
    }

    /**
     * Load/change background image.
     */
    useEffect(() => {
        const bgImageSrcTarget = bgImageLoadSrc || bgImageSrc
        if (bgImageSrcTarget) {
            const bgImage = new Image()
            const handleBgImageLoad = () => {
                setBgImageLoadSrc(bgImageSrcTarget)
                setBgImage(bgImage)
                return false
            }
            bgImage.addEventListener('load', handleBgImageLoad)
            bgImage.src = bgImageSrcTarget
            return () => {
                bgImage.removeEventListener('load', handleBgImageLoad)
            }
        }
    }, [bgImageSrc, bgImageLoadSrc])

    /**
     * Redraw canvas on bgImage load.
     */
    useEffect(() => {
        if (canvasRef.current && Object.entries(shapes).length && bgImage) {
            drawCanvas()
        }
    }, [bgImage])

    /**
     * Canvas and Dot Selector initialization.
     */
    useEffect(() => {

        // Set default styles
        canvasRef.current.style.touchAction = 'none'
        canvasRef.current.style.backgroundColor = bgColor

        // Initialize event listeners
        window.addEventListener('resize', resizeCanvas)
        canvasRef.current.addEventListener('mouseenter', (e) => {
            document.body.style.overflow = 'hidden'
        })
        canvasRef.current.addEventListener('mouseleave', (e) => {
            document.body.style.overflow = 'auto'
        })

        // Add and initialize shapes
        if (initialShapeKeys && initialShapeKeys.length) {
            const newShapes = initialShapeKeys.reduce((acc, key) => {
                if (defaultShapes[key]) acc[key] = defaultShapes[key]
                return acc
            }, {})
            const newShapesKeys = Object.keys(newShapes)
            const shapesKeys = Object.keys(shapes)
            const shapesKeysDiff = newShapesKeys.filter((key) => !shapesKeys.includes(key))
            if (shapesKeysDiff.length) {
                setShapes(newShapes)
                setShapesArr(Object.entries(newShapes).map(([key, shape]) => ({ ...shape, key })))
            }
        }

        // Initialize resize of canvas
        resizeCanvas()

        // Cleanup
        return () => window.removeEventListener('resize', resizeCanvas)
    }, [])

    /**
     * Redraw canvas on resize change after updating relative values of dot coordinates.
     */
    useEffect(() => {
        if (Object.keys(trackingShapes).length) {
            const ctx = canvasRef.current.getContext('2d', { alpha: false })

            // Scale coordinates within canvas dimensions
            const canvasElmWidth = ctx.canvas.width / resizeScaleRatio.x
            const canvasElmHeight = ctx.canvas.height / resizeScaleRatio.y
            let aspectRatio = bgImage.width / bgImage.height
            let newImgWidth = canvasElmWidth
            let newImgHeight = canvasElmWidth / aspectRatio
            if (newImgHeight > canvasElmHeight) {
                newImgWidth = canvasElmHeight * aspectRatio
                newImgHeight = canvasElmHeight
            }

            // Update shape coordinates
            const newShapesObj = {}
            const newShapesArr = Object.entries(trackingShapes).map(([key, shape]) => {
                newShapesObj[key] = {
                    ...shape,
                    x: Math.round(shape.xp * newImgWidth),
                    y: Math.round(shape.yp * newImgHeight),
                }
                return newShapesObj[key]
            })
            setShapes(newShapesObj)
            setShapesArr(newShapesArr)
            drawCanvas({ shapesArrOverride: newShapesArr })
        } else {
            drawCanvas()
        }
    }, [resizeScaleRatio])

    return {
        canvasRef,
        dotsState: trackingShapes,
        setDotsState: setShapesState,
        setBgImageLoadSrc,
        handleMouseTouchMoveDotStart,
        handleMouseTouchMoveDotEnd,
        handleMouseTouchMoveDotMove,
        handleTouchPinchZoomStart,
        handleTouchPinchZoomMove,
        handleMouseTouchMoveImageStart,
        handleMouseTouchMoveImageEnd,
        handleMouseTouchMoveImageMove,
        handleMouseWheelZoom
    }
}

export default useCanvasDotSelector