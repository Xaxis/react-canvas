import React, {useState} from 'react'
import useCanvas from './useCanvas'

const Canvas = (props) => {
    const {...rest} = props

    const dots = {
        red: {x: 20, y: 20, radius: 15, color: 'red'},
        green: {x: 40, y: 40, radius: 15, color: 'green'},
        blue: {x: 60, y: 60, radius: 15, color: 'blue'}
    }

    const shapes = Object.entries(dots).map(([key, value]) => value)

    const canvasRef = useCanvas({
        draw: (ctx, frameCount) => {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
            for (let i = 0; i < shapes.length; i++) {
                let shape = shapes[i]
                if (shape.radius) {
                    ctx.beginPath()
                    ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2)
                    ctx.fillStyle = shape.color
                    ctx.fill()
                }
            }
        }
    })

    return (
        <canvas
            ref={canvasRef}
            {...rest}
        />
    )
}

export default Canvas