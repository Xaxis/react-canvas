import React, { useState, useEffect } from 'react'
import useCanvasDotSelector from './useCanvasDotSelector'

const CanvasDemo = (props) => {
    const { ...rest } = props
    const {
        canvasRef,
        loadImageIntoCanvas,
        handleMouseTouchDown,
        handleMouseTouchUp,
        handleMouseTouchMove,
    } = useCanvasDotSelector({
        initDots: [1, 2, 3],
        dotMaxCount: 3,
        dotRadius: 8
    })

    useEffect(() => {
        loadImageIntoCanvas('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')
    }, [])

    return (
        <canvas
            ref={canvasRef}
            {...rest}
            onMouseDown={handleMouseTouchDown}
            onMouseUp={handleMouseTouchUp}
            onMouseOut={handleMouseTouchUp}
            onMouseMove={handleMouseTouchMove}
            onTouchStart={handleMouseTouchDown}
            onTouchEnd={handleMouseTouchUp}
            onTouchCancel={handleMouseTouchUp}
            onTouchMove={handleMouseTouchMove}
        />
    )
}

export default CanvasDemo