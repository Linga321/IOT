'use strict';
const url = '.';
const navi_dash = document.querySelector('#dash');
const navi_chart = document.querySelector('#chart');

//let sample_data = [];
navi_dash.className = "nav-item";
navi_chart.className = "nav-item active";
var updateInterval = 5000 //Fetch pressureever x milliseconds
var realtime = 'on' //If == to on then fetch pressureevery x seconds. else stop fetching

// be fetched from a server
let pres = [],
    speed = [],
    totalPoints = 200,
    mesg = 0;

var Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
});

const sleep = async(ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const loadChartData = async(sample_data) => {

    var new_len = sample_data.length;
    if (new_len == 0) {
        Toast.fire({
            icon: 'info',
            title: 'The file is empty'
        });
    } else {
        if (pres.length > 0) {
            pres.length = 0
                // console.log("pres slice ", pres.length);
        }
        let z = new_len - totalPoints; // get last 100 data
        while (pres.length < totalPoints) {
            pres.push(sample_data[z].pressure);
            z++;

        }

        if (speed.length > 0) {
            speed.length = 0
                // console.log("speed slice ", speed.length);
        }
        z = new_len - totalPoints;
        while (speed.length < totalPoints) {
            speed.push(sample_data[z].speed);
            z++;
        }
        // console.log("speed ", speed.length);
        //  console.log("pressure ", pres.length);
    }

    mesg = 0;
}


const getTheData = async() => {
    if (mesg < 3) { // 3 times check for the result before 
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const response = await fetch(url + '/loadchart/' + totalPoints, fetchOptions);
        const json = await response.json();
        if (json.success == 1) {
            loadChartData(JSON.parse(json.result));
            mesg = 0;
        } else {
            mesg++;
            if (mesg + 1 == 3) {
                Toast.fire({
                    icon: 'error',
                    title: 'Plaese check the mqtt or network connection'
                });
            }
        }
    } else {
        realtime = 'off';
        Toast.fire({
            icon: 'info',
            title: 'Real-time data retrieval stops '
        });
        mesg = 0;
    }
}

function getThepressure() {
    var res = []
    for (var i = 0; i < pres.length; ++i) {
        res.push([i, pres[i]]);
    }
    return res
}

function getTheSpeed() {
    var res = []
    for (var i = 0; i < speed.length; ++i) {
        res.push([i, speed[i]]);
    }
    return res
}



var interactive_plot;



function updateChart() {

    getTheData();
    //interactive_plot.destory();
    interactive_plot = $.plot($('#interactive'), [{
            data: getTheSpeed(),
            color: '#00c0ef'
        },
        {
            data: getThepressure(),
            color: '#3c8dbc'
        }
    ], {
        grid: {
            borderColor: '#f3f3f3',
            borderWidth: 1,
            tickColor: '#f3f3f3'
        },
        series: {
            lines: {
                lineWidth: 3,
                show: true,
                fill: true,
            },
        },
        yaxis: {
            min: 0,
            max: 120,
        },
        xaxis: {
            min: 0,
            max: totalPoints
        }
    })
    interactive_plot.setData([getTheSpeed(), getThepressure()])
    interactive_plot.setupGrid()
    interactive_plot.draw()
    if (realtime === 'on') {
        setTimeout(updateChart, updateInterval)
    }
}

//INITIALIZE realtime pressureFETCHING
if (realtime === 'on') {
    updateChart()
}

//realtime TOGGLE
$('#realtime .btn').click(function() {
    if ($(this).data('toggle') === 'on') {
        realtime = 'on'
    } else {
        realtime = 'off'
    }
    updateChart();
})

/*
 * END INTERACTIVE CHART
 */


// Change the button text & add active class
function changeSample(sam) {
    totalPoints = sam;
    updateChart();
    Toast.fire({
        icon: 'success',
        title: 'Chart is updating'
    })
}

const logout = async() => {
    const fetchOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    const response = await fetch(url + '/logout', fetchOptions);
    const json = await response.json();
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