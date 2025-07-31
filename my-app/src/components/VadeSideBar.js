import React from 'react'
import { useState, useRef, useEffect } from 'react'
import '../App.css'

export default function VadeSideBar() {
    const[open, setOpen] = useState(true)

    const handleClick =(e)=> {
        console.log("clicked")
    }
  return (
    <body class="sb-expanded">
        <aside>
            <nav>
                <ul>
                    <li><a href="/" className="active">General Statistics</a></li>
                    <li><a href="/">Record Browser</a></li>
                    <li><a href="/">Uplaod Data</a></li>
                </ul>
            </nav>
        </aside>
    </body>
  )
}