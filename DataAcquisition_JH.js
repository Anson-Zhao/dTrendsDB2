const axios = require('axios');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const fs = require('fs');
const cron = require('node-cron');

const con = mysql.createConnection({
    host: '10.11.90.16',
    // host: 'localhost',
    user: 'AppUser',
    password: 'Special888%',
    database: 'dtrends'
});

function axiosReq() {
    //check connection for mysql, if err,send notification
    con.connect(function (err) {
        if (err) {
            transport.sendMail(errMsg_sqlConnection, (error, info) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(`Message sent: ${info.response}`);
                }
            });
        } else {
            console.log("MySql Connected");
            //download data from OGC
            axios.get('https://github.com/CSSEGISandData/COVID-19/blob/master/csse_covid_19_data/csse_covid_19_daily_reports_us/12-02-2020.csv')
                .then((response) => {
                    console.log(response.data);

                })
                .catch(error => {
                    // console.log("download incomplete");
                    // Timeout();
                });
        }
    })
}
axiosReq();
function dataProcessing(download) {

}
//
// function Timeout() {
//     setTimeout(function () {
//         if (x < retryNum) {
//             x += 1;
//             axiosReq();
//         } else {
//             transport.sendMail(errMsg_Download, (error, info) => {
//                 if (error) {
//                     console.log(error);
//                 } else {
//                     console.log(`Message sent: ${info.response}`);
//                 }
//             });
//         }
//     }, waitTime);
// }