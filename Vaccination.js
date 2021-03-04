const axios = require('axios');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const fs = require('fs');
const cron = require('node-cron');

const con = mysql.createConnection({
    // host: '10.11.90.16',localhost
    host: '10.11.90.16',
    user: 'AppUser',
    password: 'Special888%',
    database: 'dtrends'
});

con.connect(function (err) {
    axios.get("https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.csv")
        .then((response) => {
            let vacdata = download.data;
            vacdata = vacdata.split("\n");

            //Location(Need to do select query statement to insert exactly same name from covid data)

            //Date

            //


        })
        .catch(error => {
            console.log(error);
        });



})