function submitForm(e) {
    e.preventDefault();
    const formData = {
        points: [
            {
                lat: parseFloat(document.getElementById('lat1').value).toFixed(2),
                lon: parseFloat(document.getElementById('lng1').value).toFixed(2),
            },
            {
                lat: parseFloat(document.getElementById('lat2').value).toFixed(2),
                lon: parseFloat(document.getElementById('lng2').value).toFixed(2),
            },
            {
                lat: parseFloat(document.getElementById('lat3').value).toFixed(2),
                lon: parseFloat(document.getElementById('lng3').value).toFixed(2),
            }
        ]
    };

    fetch('/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
        }
    ).then(response => response.json()).then(data => {
        const responseDiv = document.getElementById('response-message');
        const errorDiv = document.getElementById('error-message');
        if (data['valid']) { 
            responseDiv.style.display = 'block';
            errorDiv.style.display = 'none';                 
        } else {
            responseDiv.style.display = 'none';
            errorDiv.style.display = 'block';
        }
    }).catch(error => {
        console.log("wwhoopsie error uwu")
        console.log(error)
    });
}

document.querySelector('form').addEventListener('submit', submitForm)