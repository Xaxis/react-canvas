import React, { useState, useEffect } from 'react'
import useCanvasDotSelector from './useCanvasDotSelector'

const CanvasDemo = (props) => {
    const { ...rest } = props
    const {
        canvasRef,
        loadImageIntoCanvas,
        setActiveDots,
        handleMouseTouchMoveDotDown,
        handleMouseTouchMoveDotUp,
        handleMouseTouchMoveDotMove,
        handleTouchPinchZoomStart,
        handleTouchPinchZoomMove,
        handleMouseTouchMoveImageStart,
        handleMouseTouchMoveImageEnd,
        handleMouseTouchMoveImageMove,
        handleMouseWheelZoom,
        activeDot,
        dots
    } = useCanvasDotSelector({
        initBgColor: '#000000',
        initBgImageSrc: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
        initDots: [1, 2, 3],
        dotRadius: 8,
        drawBgImageBox: true,
    })

    useEffect(() => {
        // loadImageIntoCanvas('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')

        // setTimeout(() => {
        //     setActiveDots([1, 2, 3, 4, 5, 6])
        // }, 3000)
    }, [])

    useEffect(() => {
        if (1 in dots) {
            // console.log(dots[1])
        }
    }, [dots])

    return (
        <canvas
            ref={canvasRef}
            {...rest}
            onMouseDown={(e) => {
                handleMouseTouchMoveDotDown(e)
                handleMouseTouchMoveImageStart(e)
            }}
            onMouseUp={(e) => {
                handleMouseTouchMoveDotUp(e)
                handleMouseTouchMoveImageEnd(e)
            }}
            onMouseOut={(e) => {
                handleMouseTouchMoveDotUp(e)
                handleMouseTouchMoveImageEnd(e)
            }}
            onMouseMove={(e) => {
                handleMouseTouchMoveDotMove(e)
                handleMouseTouchMoveImageMove(e)
            }}
            onTouchStart={(e) => {
                handleMouseTouchMoveDotDown(e)
                handleTouchPinchZoomStart(e)
                handleMouseTouchMoveImageStart(e)
            }}
            onTouchEnd={(e) => {
                handleMouseTouchMoveDotUp(e)
                handleMouseTouchMoveImageEnd(e)
            }}
            onTouchCancel={(e) => {
                handleMouseTouchMoveDotUp(e)
                handleMouseTouchMoveImageEnd(e)
            }}
            onTouchMove={(e) => {
                handleMouseTouchMoveDotMove(e)
                handleTouchPinchZoomMove(e)
                handleMouseTouchMoveImageMove(e)
            }}
            onWheel={(e) => {
                handleMouseWheelZoom(e)
            }}
        />
    )
}

export default CanvasDemo