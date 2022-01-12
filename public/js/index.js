'use strict';


// Get a list of cars and add them to page
const url = '.';
const div_parent = document.querySelector('#car-container');
const navi_dash = document.querySelector('#dash');
const navi_chart = document.querySelector('#chart');
const auto_mode_check = document.querySelector('#auto_mode_check');
const auto_mode_set_p = document.querySelector('#a_m_pressure');
const auto_mode_set_s = document.querySelector('#a_m_speed');
const speed_range = document.querySelector('#speed_range');
const presser_range = document.querySelector('#presser_range');

let pre_speed_range = 0;
let pre_presser_range = 0;

var updateInterval = 5000 //Fetch data eever x milliseconds
var realtimeauto = 'on' //If == to on then fetch data every (updateInterval) seconds. else stop fetching
var realtimeauto_pres = 'on' //If == to on then fetch pressure
var realtimeauto_speed = 'on' //If == to on then fetch speed
var mesg = 0; // 

document.querySelector('#speed_range1').classList.add("auto_mode");
document.querySelector('#presser_range1').classList.add("auto_mode");
navi_dash.className = "nav-item active";
navi_chart.className = "nav-item";

var Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
});
/**
 * Send the data to modify
 */

function sendData(url, data) {
    console.log("Url ", url, data);
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (this.readyState == 4 && (this.status == 200 | this.status == 240)) {
            const json = JSON.parse(req.response);
            if (json.success == 1) {
                if (mesg == 0) {
                    Toast.fire({
                        icon: 'success',
                        title: json.message
                    })
                } else {
                    Toast.fire({
                        icon: 'success',
                        title: 'data :' + data
                    })
                }
                mesg++;
                updateData();
            } else {
                Toast.fire({
                    icon: 'error',
                    title: json.message
                })
            }
        }

    };
    req.open("GET", url + data, true);
    req.send();

}

$('#speed_range').ionRangeSlider({
    min: 0,
    max: 100,
    type: 'single',
    step: 1,
    postfix: '% Speed',
    prettify: false,
    hasGrid: true,
    disable: true,
})

$('#presser_range').ionRangeSlider({
    min: 0,
    max: 120,
    type: 'single',
    step: 1,
    postfix: ' Pa',
    prettify: false,
    hasGrid: true,
    disable: true,
})

$('#speed_range').parent().on('click', function() {
    if (auto_mode_check.checked) {
        if (realtimeauto_speed == 'on') {
            auto_mode_set_p.innerHTML = "Pressure";
            auto_mode_set_s.innerHTML = "Speed (sends data)";
            realtimeauto_pres = 'on';
            mesg = 0;
        }

        realtimeauto_speed = 'off';
        console.log("S", speed_range.value);
        sendData("set/speed/", speed_range.value);
    }
});

$('#presser_range').parent().on('click', function() {

    if (auto_mode_check.checked) {
        if (realtimeauto_pres == 'on') {
            auto_mode_set_p.innerHTML = "Pressure (sends data)";
            auto_mode_set_s.innerHTML = "Speed";
            realtimeauto_speed = 'on';
            mesg = 0;
        }
        realtimeauto_pres = 'off';
        console.log("P", presser_range.value);
        sendData("set/pressure/", presser_range.value);

    }
});

function realTimeLoadData() {
    navi_dash.className = "nav-item active";
    navi_chart.className = "nav-item";
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (this.readyState == 4 && (this.status == 200 | this.status == 240)) {
            const json = JSON.parse(req.response);
            if (json.success == 1) {
                const mqtt_data = JSON.parse(json.result);

                if (realtimeauto_speed == 'on') {
                    $speed_range.update({
                        from: mqtt_data.speed, //your new value
                    });
                    console.log("S", speed_range.value);
                }
                if (realtimeauto_pres == 'on') {
                    $presser_range.update({
                        from: mqtt_data.pressure, //your new value
                    });
                    console.log("P", presser_range.value);
                }
            } else {
                realtimeauto = 'off';
                Toast.fire({
                    icon: 'error',
                    title: json.message
                })

            }
        }
    };
    req.open("GET", "loaddash", true);
    req.send();

}

auto_mode_check.addEventListener("click", async() => {
    var $speed_range = $('#speed_range').data("ionRangeSlider");
    var $presser_range = $('#presser_range').data("ionRangeSlider");
    if (!auto_mode_check.checked) {
        realtimeauto = 'on';
        realtimeauto_pres = 'on';
        realtimeauto_speed = 'on';
        auto_mode_set_p.innerHTML = "Pressure";
        auto_mode_set_s.innerHTML = "Speed";
        console.log("P", presser_range.value);
        sendData("set/pressure/" + presser_range.value);
        document.querySelector('#speed_range1').classList.add("auto_mode");
        document.querySelector('#presser_range1').classList.add("auto_mode");
        $speed_range.update({ "disable": true });
        $presser_range.update({ "disable": true });
    } else {
        $speed_range.update({ "disable": false });
        $presser_range.update({ "disable": false });
        realtimeauto = 'off';
        document.querySelector('#speed_range1').classList.remove('auto_mode');
        document.querySelector('#presser_range1').classList.remove('auto_mode');
    }
    updateData();
});


function updateData() {
    realTimeLoadData();
    if (realtimeauto === 'on') {
        setTimeout(updateData, updateInterval)
    }
}

//INITIALIZE realtimePres pressureFETCHING
if (realtimeauto === 'on') {
    updateData()
}

const logout = async() => {
    const fetchOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    const response = await fetch(url + '/logout', fetchOptions);
    if (json.success == 1) {
        Toast.fire({
            icon: 'success',
            title: json.message
        })
        window.location.href = "http://localhost:3000/login";
    } else {
        Toast.fire({
            icon: 'error',
            title: json.message
        })
    }
}