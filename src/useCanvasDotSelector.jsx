import { useRef, useState, useEffect } from 'react'

const useCanvasDotSelector = (options = {}) => {
    const {
        bgColor = '#000000',
        bgImageSrc = '',
        initDots = [],
        dotRadius = 10,
    } = options
    const canvasRef = useRef(null)

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
        const {deltaY: delta} = e
        if (delta > 0) {
            zoom -= 0.1
        } else {
            zoom += 0.1
        }
        const clampedZoomScale = Math.min(Math.max(zoom, 1), 6)
        setZoomScale(clampedZoomScale)

        // While zooming out, set imageMoveOffsetCoords closer to 0 the closer clampedZoomScale gets to 1
        // We do this so it stays within the constraints of the bounding box when zooming back out after moving it
        const clampedZoomScaleOffset = (clampedZoomScale - 1) / 6
        const updatedCoords = {
            x: imageMoveOffsetCoords.x * clampedZoomScaleOffset,
            y: imageMoveOffsetCoords.y * clampedZoomScaleOffset
        }
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
        if (canvasRef.current.style.cursor === 'default') {
            canvasRef.current.style.cursor = 'grab'
        }
        if (!imageMoveDragging || activeDraggingShape || zoomScale <= 1) return
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
        const isMoveWithinBounds = handleMouseTouchInsideBgImageBoundingBoxHitDetect(mx, my)
        if (!isMoveWithinBounds) return false
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

            // Get coordinates of the centered- bg image inside the canvas. These are used to track the offsets for the
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

            // Draw shapes ("dots")
            for (let i = 0; i < shapesArrOverride.length; i++) {
                let shape = shapesArrOverride[i]

                // Hide shape if set to hidden
                if (!shape.show) continue

                // Set opacity of set circles
                if (shape.set) {
                    ctx.globalAlpha = 0.5
                }

                // Set shape coordinates relative to the background image coordinates and zoom scale
                let shapeX = shape.xx = Math.floor((shape.x * zoomScaleOverride) + bgImgOffsX + imageMoveOffsetCoords.x)
                let shapeY = shape.yy = Math.floor((shape.y * zoomScaleOverride) + bgImgOffsY + imageMoveOffsetCoords.y)

                // Draw white line circle
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
                    xp: Math.round((shape.x / bgImage.width) * 10000) / 10000,
                    yp: Math.round((shape.y / bgImage.height) * 10000) / 10000,
                }
                return shape
            })
            setTrackingShapes(newTrackingShapes)
        }
    }

    const resizeCanvas = () => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d', { alpha: false })
        const { width, height } = canvas.getBoundingClientRect()
        if (canvas.width !== width || canvas.height !== height) {
            const { devicePixelRatio:ratio=1 } = window
            canvas.width = width * ratio
            canvas.height = height * ratio
            ctx.scale(ratio, ratio)
            return { deltaWidth: width, deltaHeight: height }
        }
        return false
    }

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

    useEffect(() => {

        // Set default styles
        canvasRef.current.style.touchAction = 'none'
        canvasRef.current.style.backgroundColor = bgColor

        // Initialize event listeners
        canvasRef.current.addEventListener('resize', resizeCanvas)
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

        // Initialize canvas resize
        resizeCanvas()

        // Cleanup
        return () => canvasRef.current.removeEventListener('resize', resizeCanvas)
    }, [])

    /**
     * Redraw canvas on bgImage change.
     */
    useEffect(() => {
        if (canvasRef.current && Object.entries(shapes).length && bgImage) {
            drawCanvas()
        }
    }, [bgImage])

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