import React, { useState, useEffect } from 'react'
import useCanvasDotSelector from './useCanvasDotSelector'

const CanvasDemo = (props) => {
    const { ...rest } = props
    const {
        canvasRef,
        dotsState,
        setDotsState,
        setBgImageLoadSrc,

        // setActiveDots, // @todo

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
        // setBgImageLoadSrc('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')
        // setBgImageLoadSrc('https://www.thenews.com.pk/assets/uploads/tns/2015-03-15/558241_5306933_tns.jpg')
    }, [])

    /**
     * Demonstrate changing state properties of a dot.
     */
    useEffect(() => {
        // console.log('dotsState', dotsState)
    }, [dotsState])

    /**
     * @todo ... Do we need this anymore?
     */
    useEffect(() => {
        // setTimeout(() => {
        //     setActiveDots([1, 2, 3, 4, 5, 6])
        // }, 3000)
    }, [])

    return (
        <canvas
            ref={canvasRef}
            {...rest}

            // Demonstrate changing state properties of a dot.
            onDoubleClick={(e) => {
                dotsState.b.show = false
                setDotsState(dotsState)
            }}

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

export default CanvasDemo