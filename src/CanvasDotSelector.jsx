import React, { useState, useEffect } from 'react'
import useCanvasDotSelector from './useCanvasDotSelector'

const CanvasDotSelector = (props) => {
    const { ...rest } = props
    const {
        canvasRef,
        dotsState,
        setDotsState,
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
    } = useCanvasDotSelector({
        bgColor: '#000000',
        bgImageSrc: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
        initDots: ['r', 'g', 'b'],
        dotRadius: 8
    })

    /**
     * Demonstrate changing/loading a new background image.
     */
    useEffect(() => {
        // setTimeout(() => {
        //     setBgImageLoadSrc('https://www.thenews.com.pk/assets/uploads/tns/2015-03-15/558241_5306933_tns.jpg')
        // }, 2000)
    }, [])

    /**
     * Demonstrate changing state properties of a dot.
     */
    useEffect(() => {
        // console.log('dotsState', dotsState)
        if (Object.entries(dotsState).length) {
            // console.log('dotsState.b', dotsState.b)
        }
    }, [dotsState])

    return (
        <canvas
            ref={canvasRef}
            {...rest}

            // Demonstrate changing dot state
            // onDoubleClick={(e) => {
            //
            //     // Change state of 'b' (blue) dot
            //     dotsState.b.show = false
            //     setDotsState(dotsState)
            // }}

            onMouseDown={(e) => {
                handleMouseTouchMoveDotStart(e)
                handleMouseTouchMoveImageStart(e)
            }}
            onMouseUp={(e) => {
                handleMouseTouchMoveDotEnd(e)
                handleMouseTouchMoveImageEnd(e)
            }}
            onMouseOut={(e) => {
                handleMouseTouchMoveDotEnd(e)
                handleMouseTouchMoveImageEnd(e)
            }}
            onMouseMove={(e) => {
                handleMouseTouchMoveDotMove(e)
                handleMouseTouchMoveImageMove(e)
            }}
            onTouchStart={(e) => {
                handleMouseTouchMoveDotStart(e)
                handleTouchPinchZoomStart(e)
                handleMouseTouchMoveImageStart(e)
            }}
            onTouchEnd={(e) => {
                handleMouseTouchMoveDotEnd(e)
                handleMouseTouchMoveImageEnd(e)
            }}
            onTouchCancel={(e) => {
                handleMouseTouchMoveDotEnd(e)
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

export default CanvasDotSelector