import React, { useState, useEffect } from 'react'
import useCanvasDotSelector from './useCanvasDotSelector'

const CanvasDemo = (props) => {
    const { ...rest } = props
    const {
        handleMouseTouchDown,
        handleMouseTouchUp,
        handleMouseTouchMove,
        canvasRef
    } = useCanvasDotSelector({
        dotMaxCount: 3,
        dotRadius: 8
    })

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