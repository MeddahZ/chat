const socket =io()

const $messageForm = document.querySelector('#form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate  = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix : true})

const autoScroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const contentHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(contentHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight

    }

}

socket.on('locationsent', (location) => {
    console.log(location)
    const geo = Mustache.render(locationTemplate, {
        username: location.username,
        location: location.text,
        createdAt: moment(location.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', geo)
    autoScroll()
})

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({room, users}) => {
    // console.log(room)
    // console.log(users)
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    socket.emit('newmsg', message, (message) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        console.log(message)
    })
    
})

$locationButton.addEventListener('click', () => {    
    if(!navigator.geolocation){
        return alert('geolocation is not supported by your browser :(')
    }
    $locationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position)=> {
        socket.emit('sendlocation', {latitude: position.coords.latitude, longitude: position.coords.longitude}, () => {
            $locationButton.removeAttribute('disabled')
            console.log('location shared!')
        })
    })
})


socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
