function changePage(id, way, numer = 1) {
    if (id == 1 && way == 'minus') return
    if (way == 'plus' && !document.getElementById(`p${Number(id) + 1}`)) return
    const currentPage = document.getElementById(`p${id}`)
    console.log(currentPage)
    console.log(id)
    way == 'plus' ? currentPage.classList.add('left') : ''
    way == 'plus' ? document.getElementById(`c${id}`).classList.add('left') : ''
    currentPage.classList.remove('active')
    document.getElementById(`c${id}`).classList.remove('active')
    let newPage = `p${Number(currentPage.dataset.num)}`
    switch (way) {
        case 'plus': newPage = `p${Number(id) + 1}`; break
        case 'minus': newPage = `p${Number(id) - 1}`; break
        case 'dirrect': newPage = `p${Number(numer)}`; break
    }
    console.log(newPage)
    if (way == 'dirrect') {
        document.querySelectorAll('.page').forEach(page => {
            if (page.dataset.num < numer && !page.classList.contains('left')) page.classList.add('left')
            if (page.dataset.num > numer && page.classList.contains('active')) page.classList.remove('active')
        })
        document.querySelectorAll('.circle').forEach(circle => {
            console.log(circle.classList)
            console.log(circle.classList.contains('active'))
            if (circle.id.replace('c', '') < numer && !circle.classList.contains('left')) circle.classList.add('left')
            if (circle.id.replace('c', '') > numer && circle.classList.contains('left')) circle.classList.remove('left')
        })
    }
    
    document.getElementById(newPage).classList.remove('left')
    document.getElementById(newPage.replace('p', 'c')).classList.remove('left')
    
    document.getElementById(newPage).classList.add('active')
    document.getElementById(newPage.replace('p', 'c')).classList.add('active')
}

document.addEventListener('keydown', (event) => {
    console.log(event.key)
    if (event.key == ' ' || event.key == 'ArrowDown' || event.key == 'ArrowRight') {
        const currentPage = document.querySelector('.page.active')
        changePage(currentPage.dataset.num, 'plus')
    } else if (event.key == 'ArrowUp' || event.key == 'ArrowLeft') {
        const currentPage = document.querySelector('.page.active')
        changePage(currentPage.dataset.num, 'minus')
    }
})

window.ws.connect()
window.ws.on('set', (data) => {
    if (data.value == '2') {
        const currentPage = document.querySelector('.page.active')
        changePage(currentPage.dataset.num, 'plus')
    } else if (data.value == '1') {
        const currentPage = document.querySelector('.page.active')
        changePage(currentPage.dataset.num, 'minus')
    } else if (data.value == '3') {
        const element = document.querySelector('#txtPart7');
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth', // Плавная прокрутка (вместо резкого прыжка)
                block: 'start'      // К какому краю прижать элемент: start, center, end или nearest
            });
        }
    }
    console.log(data)
})

document.querySelectorAll('.circle').forEach(el => {
    el.addEventListener('click', () => {
        changePage(document.querySelector('.page.active').dataset.num, 'dirrect', el.id.replace('c', ''))
    })
})