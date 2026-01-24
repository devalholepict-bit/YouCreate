const addRectangleBtn = document.querySelector('#rectangle')
const addTextBtn = document.querySelector('#addText')
const canvas = document.querySelector('#canvas')
const list=document.querySelector('#list')

//proerties panel required element
const propsPanel = document.querySelector('#props')
const noSelection = document.querySelector('#no-selection')

const propX = document.querySelector('#prop-x')
const propY = document.querySelector('#prop-y')
const propWidth = document.querySelector('#prop-width')
const propHeight = document.querySelector('#prop-height')
const propRotation = document.querySelector('#prop-rotation')
const propColor = document.querySelector('#prop-color')



let elementId = 0
let selectedElement = null

// drag state
let isDragging = false
let dragOffsetX = 0
let dragOffsetY = 0

// resize state
let resizeMode = null
let startMouseX = 0
let startMouseY = 0
let startWidth = 0
let startHeight = 0
let startLeft = 0
let startTop = 0

// rotation state
let isRotating = false
let startAngle = 0
let baseRotation = 0

function setupElement(element, type) {
    // basic metadata
    element.dataset.id = `${type}-${elementId++}`
    element.dataset.type = type
    element.dataset.rotation = 0
    element.style.position = 'absolute'

    // ---- selection ----
    element.addEventListener('click', (e) => {
        e.stopPropagation()

        if (selectedElement) {
            selectedElement.classList.remove('selectedrect')
        }

        element.classList.add('selectedrect')
        selectedElement = element
        updateLayerPanel()
        updatePropertiesPanel()
    })


    // ---- drag start ----
element.addEventListener('mousedown', (e) => {
    if (selectedElement !== element) return
    if (e.target.classList.contains('rotate-handle')) return
    if (e.target.classList.contains('handles')) return 

    e.preventDefault() 
    isDragging = true

    const box = element.getBoundingClientRect()
    dragOffsetX = e.clientX - box.left
    dragOffsetY = e.clientY - box.top
})

// ---- resize handles ----
const positions = ['topleft', 'topright', 'bottomleft', 'bottomright']

positions.forEach(pos => {
    const handle = document.createElement('div')
    handle.classList.add('handles', pos)
    element.appendChild(handle)

    handle.addEventListener('mousedown', (e) => {
        e.stopPropagation()
        if (selectedElement !== element) return

        resizeMode = pos
        startMouseX = e.clientX
        startMouseY = e.clientY
        startWidth = element.offsetWidth
        startHeight = element.offsetHeight
        startLeft = element.offsetLeft
        startTop = element.offsetTop
    })
})

// ---- rotate handle ----
const rotateHandle = document.createElement('div')
rotateHandle.classList.add('rotate-handle')
element.appendChild(rotateHandle)

rotateHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation()
    if (selectedElement !== element) return 
    isRotating = true

    const box = element.getBoundingClientRect()
    const centerX = box.left + box.width / 2
    const centerY = box.top + box.height / 2

    startAngle = Math.atan2(
        e.clientY - centerY,
        e.clientX - centerX
    )

    baseRotation = parseFloat(element.dataset.rotation)
})



    // add element to canvas
    canvas.appendChild(element)
}

//ADD RECTANGLE TO CANVAS
addRectangleBtn.addEventListener('click', () => {
    const rect = document.createElement('div')
    rect.classList.add('newrectangle')
    rect.style.left = Math.random() * (canvas.offsetWidth - 120) + 'px'
    rect.style.top = Math.random() * (canvas.offsetHeight - 80) + 'px'

    setupElement(rect, 'rectangle')
    updateLayerPanel()
    autoSave()
})

//ADD TEXTBOX TO CANVAS
addTextBtn.addEventListener('click', () => {
    const textBox = document.createElement('div')
    textBox.classList.add('textbox')
    textBox.contentEditable = true
    textBox.innerText = 'Edit text'
    textBox.style.left = Math.random() * (canvas.offsetWidth - 120) + 'px'
    textBox.style.top = Math.random() * (canvas.offsetHeight - 80) + 'px'

    setupElement(textBox, 'text')
    updateLayerPanel()
})

document.addEventListener('mousemove', (e) => {
    // ---- ROTATION ----
    if (isRotating && selectedElement) {
        const box = selectedElement.getBoundingClientRect()
        const centerX = box.left + box.width / 2
        const centerY = box.top + box.height / 2

        const currentAngle = Math.atan2(
            e.clientY - centerY,
            e.clientX - centerX
        )

        const angleDiff = currentAngle - startAngle
        const degrees = baseRotation + angleDiff * 180 / Math.PI

        selectedElement.style.transform = `rotate(${degrees}deg)`
        selectedElement.dataset.rotation = degrees

        updatePropertiesPanel()
        return
    }

// ---- RESIZE ----
    if (resizeMode && selectedElement) {
        const dx = e.clientX - startMouseX
        const dy = e.clientY - startMouseY

        let w = startWidth
        let h = startHeight
        let l = startLeft
        let t = startTop

        if (resizeMode === 'bottomright') {
            w += dx
            h += dy
        }
        if (resizeMode === 'bottomleft') {
            w -= dx
            h += dy
            l += dx
        }
        if (resizeMode === 'topright') {
            w += dx
            h -= dy
            t += dy
        }
        if (resizeMode === 'topleft') {
            w -= dx
            h -= dy
            l += dx
            t += dy
        }

        const MIN = 30
        if (w < MIN) w = MIN
        if (h < MIN) h = MIN

        selectedElement.style.width = w + 'px'
        selectedElement.style.height = h + 'px'
        selectedElement.style.left = l + 'px'
        selectedElement.style.top = t + 'px'

        updatePropertiesPanel()
        return
    }





    //drag
    if (!isDragging || !selectedElement) return

    const canvasBox = canvas.getBoundingClientRect()

    let x = e.clientX - canvasBox.left - dragOffsetX
    let y = e.clientY - canvasBox.top - dragOffsetY

    const maxX = canvas.offsetWidth - selectedElement.offsetWidth
    const maxY = canvas.offsetHeight - selectedElement.offsetHeight

    if (x < 0) x = 0
    if (y < 0) y = 0
    if (x > maxX) x = maxX
    if (y > maxY) y = maxY

    selectedElement.style.left = x + 'px'
    selectedElement.style.top = y + 'px'
    updatePropertiesPanel()
})

document.addEventListener('mouseup', () => {
    isDragging = false
    resizeMode = null
    isRotating = false
    autoSave()
        
})

canvas.addEventListener('click', () => {
    if (selectedElement) {
        selectedElement.classList.remove('selectedrect')
        selectedElement = null
        updatePropertiesPanel()
        updateLayerPanel()

    }
})



//LAYER PANEL
const updateLayerPanel=()=>{
    list.innerHTML=''
    let elements =[...canvas.children]
     
    elements.forEach(elem=>{
        const listelem=document.createElement('li')
        listelem.classList.add('listelem')
       
        const title=document.createElement('span')
        title.textContent=`${elem.dataset.type} (${elem.dataset.id})`

        const upbtn=document.createElement('button')
        upbtn.textContent= '↑'

        const downbtn=document.createElement('button')
        downbtn.textContent= '↓'

    
        //!!!!!!!!!->click btn=stack ordering AND Shift + click btn brings element forward
        upbtn.addEventListener('click',(dets)=>{
            dets.stopPropagation()
            if (dets.shiftKey) {
                // Bring to Front
                canvas.appendChild(elem)
            }
            else{
                const above=elem.nextElementSibling
                if(above){
                    canvas.insertBefore(above,elem) 
            }
            }
            updateLayerPanel()
        })

         //!!!!!!!!!->click btn=stack ordering AND Shift + click btn brings element backward
       downbtn.addEventListener('click', (dets) => {
            dets.stopPropagation()

            if (dets.shiftKey) {
                // Send to Back
               const firstElement = canvas.children[0]
                if (firstElement && firstElement !== elem){
                    canvas.insertBefore(elem, firstElement)
                }
            } else {
                // Move Down (one step)
                const prev = elem.previousElementSibling
                if (prev) {
                canvas.insertBefore(elem, prev)
        }
    }

        updateLayerPanel()
    })

        if(elem ===selectedElement)
        {
            listelem.classList.add('active')
        }

        //select element of canvas when layer component is clicked
        listelem.addEventListener('click',()=>{
            if(selectedElement)
            {
                selectedElement.classList.remove('selectedrect')
            }
            selectedElement=elem
            elem.classList.add('selectedrect')
            updateLayerPanel()
            updatePropertiesPanel()

        })

        const actions = document.createElement('div')
        actions.classList.add('listactions')

        actions.appendChild(upbtn)
        actions.appendChild(downbtn)

        listelem.appendChild(title)
        listelem.appendChild(actions)
       
        list.appendChild(listelem)
       
    })
}


//PROPERTIES PANEL
function updatePropertiesPanel() {
    if (!selectedElement) {
        propsPanel.style.display = 'none'
        noSelection.style.display = 'block'
        return
    }

    noSelection.style.display = 'none'
    propsPanel.style.display = 'block'

    propX.value = parseInt(selectedElement.style.left) || 0
    propY.value = parseInt(selectedElement.style.top) || 0
    propWidth.value = selectedElement.offsetWidth
    propHeight.value = selectedElement.offsetHeight
    propRotation.value = parseFloat(selectedElement.dataset.rotation) || 0

    if (selectedElement.dataset.type === 'rectangle') {
        propColor.disabled = false
        propColor.value = rgbToHex(
            getComputedStyle(selectedElement).backgroundColor
        )
    } else {
        propColor.disabled = true
    }
}


//applying property chnages
//X coordinate
propX.addEventListener('input', () => {
    if (selectedElement)
        selectedElement.style.left = propX.value + 'px'
})

//y coordinate
propY.addEventListener('input', () => {
    if (selectedElement)
        selectedElement.style.top = propY.value + 'px'
})

//width
propWidth.addEventListener('input', () => {
    if (selectedElement)
        selectedElement.style.width = propWidth.value + 'px'
})

//height
propHeight.addEventListener('input', () => {
    if (selectedElement)
        selectedElement.style.height = propHeight.value + 'px'
})

//rotation angle
propRotation.addEventListener('input', () => {
    if (!selectedElement) return
    selectedElement.style.transform =
        `rotate(${propRotation.value}deg)`
    selectedElement.dataset.rotation = propRotation.value
})

//color property
propColor.addEventListener('input', () => {
    if (
        selectedElement &&
        selectedElement.dataset.type === 'rectangle'
    ) {
        selectedElement.style.backgroundColor = propColor.value
    }
})

//color conversion
function rgbToHex(rgb) {
    const vals = rgb.match(/\d+/g)
    if (!vals) return '#000000'
    return (
        '#' +
        vals
            .slice(0, 3)
            .map(v =>
                parseInt(v).toString(16).padStart(2, '0')
            )
            .join('')
    )
}


//KEYBOARD SHORTCUTS
document.addEventListener('keydown',(dets)=>{
    if(!selectedElement) return
    //avoid conflicts while editing in textbox
    if( selectedElement.dataset.type==='text' && document.activeElement===selectedElement) return

    const step = dets.shiftKey? 60:1

    let x=selectedElement.offsetLeft
    let y=selectedElement.offsetTop

    //to consider boundry restriction
    const maxX = canvas.offsetWidth - selectedElement.offsetWidth
    const maxY = canvas.offsetHeight - selectedElement.offsetHeight


    //key specific task performance
    switch(dets.key){
        case 'Delete':
            case 'Backspace':
                deleteElement()
                autoSave()
                return
                break

        case 'Escape':
            deselectElement()
            return
            break

        case 'ArrowLeft':
            x-=step
            break

         case 'ArrowRight':
            x+=step
            break

         case 'ArrowUp':
            y-=step
            break

         case 'ArrowDown':
            y+=step
            break
    }


    //boundry restriction 
    if (x < 0) x = 0
    if (y < 0) y = 0
    if (x > maxX) x = maxX
    if (y > maxY) y = maxY

    selectedElement.style.left = x + 'px'
    selectedElement.style.top = y + 'px'

    updatePropertiesPanel()

})

//delete function
const deleteElement = ()=>{
    if(!selectedElement) return

    selectedElement.remove()
    selectedElement=null
    updateLayerPanel()
    updatePropertiesPanel()
}


//deselect element function
const deselectElement=()=>{
    if(!selectedElement) return

    selectedElement.classList.remove('selectedrect')
    selectedElement=null
    updateLayerPanel()
    updatePropertiesPanel()
} 


//AUTO SAVE AND LOAD
let saveTimeout

function autoSave() {
   const data = getLayoutData()
    localStorage.setItem('editor-data', JSON.stringify(data))
    showSaveStatus()
}

//data collector
function getLayoutData() {
    const data = []
    const elements=[...canvas.children]
    elements.forEach(el => {
        const item = {
            id: el.dataset.id,
            type: el.dataset.type,
            x: el.offsetLeft,
            y: el.offsetTop,
            width: el.offsetWidth,
            height: el.offsetHeight,
            rotation: el.dataset.rotation || 0
        }

        if (item.type === 'rectangle') {
            item.color = el.style.backgroundColor
        }

        if (item.type === 'text') {
            item.text = el.innerText
            item.color = el.style.color
        }

        data.push(item)
    })

    return data
}


//GIVES CLEAR FEEDBACK FOR SAVE
function showSaveStatus() {
    const status = document.getElementById('saveStatus')
    if (!status) return

    status.textContent = 'Saved ✓'
    status.style.opacity = 1

    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
        status.style.opacity = 0
    }, 1000)
}


//AUTO LOAD ON REFRESH
window.addEventListener('load', () => {
    const json = localStorage.getItem('editor-data')
    if (!json) return

    const data = JSON.parse(json)

    canvas.innerHTML = ''
    selectedElement = null

    data.forEach(item => {
        let el

        if (item.type === 'rectangle') {
            el = document.createElement('div')
            el.classList.add('newrectangle')
            el.style.backgroundColor = item.color
        }

        if (item.type === 'text') {
            el = document.createElement('div')
            el.classList.add('textbox')
            el.contentEditable = true
            el.innerText = item.text
            el.style.color = item.color
        }

        el.style.left = item.x + 'px'
        el.style.top = item.y + 'px'
        el.style.width = item.width + 'px'
        el.style.height = item.height + 'px'
        el.style.transform = `rotate(${item.rotation}deg)`

        el.dataset.id = item.id
        el.dataset.type = item.type
        el.dataset.rotation = item.rotation

        setupElement(el, item.type)
    })

    updateLayerPanel()
    updatePropertiesPanel()
})

//CLEAR CANVAS
const clearCanvasBtn = document.querySelector('#clearCanvas')

clearCanvasBtn.addEventListener('click', () => {
    const ok = confirm('Start a new design? This will clear the canvas.')
    if (!ok) return

    
    canvas.innerHTML = ''

    
    selectedElement = null
    elementId = 0

    
    localStorage.removeItem('editor-data')

    
    updateLayerPanel()
    updatePropertiesPanel()

   
    
})

//EXPORT LOGIC

//export button logic
const exportHeader = document.querySelector('#exportHeader')
const exportOptions = document.querySelector('#exportOptions')

exportHeader.addEventListener('click', () => {
     exportHeader.classList.toggle('open')
     exportOptions.classList.toggle('open')
})

//json export
document.querySelector('#exportJSON').addEventListener('click', () => {
    const data = getLayoutData()

    downloadFile(
        JSON.stringify(data, null, 2),
        'design.json',
        'application/json'
    )

    showSaveStatus()
})

//HTML export
document.querySelector('#exportHTML').addEventListener('click', () => {
    const data = getLayoutData()

    let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Exported Design</title>
</head>
<body>
<div style="position:relative;width:${canvas.offsetWidth}px;height:${canvas.offsetHeight}px;">
`

    data.forEach(item => {
        let style = `
            position:absolute;
            left:${item.x}px;
            top:${item.y}px;
            width:${item.width}px;
            height:${item.height}px;
            transform:rotate(${item.rotation}deg);
        `

        if (item.type === 'rectangle') {
            html += `<div style="${style}background:${item.color};"></div>`
        }

        if (item.type === 'text') {
            html += `<div style="${style}color:${item.color};">${item.text}</div>`
        }
    })

    html += `
</div>
</body>
</html>
`

    downloadFile(html, 'design.html', 'text/html')
    showSaveStatus()

})

//helper function for export
function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()

    URL.revokeObjectURL(url)
}



//HOME PAGE
const home = document.getElementById("home");
const main = document.getElementById("main");
const getStartedBtn = document.getElementById("btn");
const homeBtn = document.getElementById("homeBtn");

// show home
function showHome() {
    home.style.display = "flex";
    main.style.display = "none";
    localStorage.setItem("stigma-mode", "home");
}

// show editor
function showEditor() {
    home.style.display = "none";
    main.style.display = "flex";
    localStorage.setItem("stigma-mode", "editor");
    localStorage.setItem("stigma-onboarded", "true");
}

// INITIAL LOAD (NO FLICKER)
document.addEventListener("DOMContentLoaded", () => {
    const mode = localStorage.getItem("stigma-mode");
    const hasDesign = localStorage.getItem("editor-data");

    // FIRST VISIT OR NO DESIGN EXISTS
    if (!hasDesign) {
        home.style.display = "flex";
        main.style.display = "none";
        localStorage.setItem("stigma-mode", "home");
        return;
    }

    // DESIGN EXISTS
    if (mode === "editor") {
        home.style.display = "none";
        main.style.display = "flex";
    } else {
        home.style.display = "flex";
        main.style.display = "none";
    }
});


// buttons
getStartedBtn.addEventListener("click", showEditor);
homeBtn.addEventListener("click", showHome);




