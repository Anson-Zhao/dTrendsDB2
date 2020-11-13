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

const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'aaaa.zhao@g.northernacademy.org',
        pass: 'qwer1234',
    },
});

const errMsg_Download = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com; azhao@northernacademy.org',
    subject: 'Error Appearance From Covid Data Algorithm',
    html: 'Data can not insert.',
};

const errMsg_DataLength = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com; azhao@northernacademy.org',
    subject: 'Data Length incorrect',
    html: 'Data did not insert.',
};

const errMsg_sqlConnection = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com,azhao@northernacademy.org;',
    subject: 'SQL Disconnected',
    html: 'SQL Disconnected.',
};

const errMsg_UndefinedCont = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com,azhao@northernacademy.org;',
    subject: 'Undefined Continent Appears',
    html: 'Undefined Continent Appears',
};

const dataErr = {
    from: 'aaaa.zhao@g.northernacademy.org',
    to: 'yumingxian7012@gmail.com;azhao@northernacademy.org;',
    subject: 'Data deleted.',
    attachments: [{
        fileName: 'datadeleted.json',
        path: 'datadeleted.json'
    }]
};

let x = 0;
let waitTime = 30000;
let difLimit = 50;
// let intervalTime = 24 * 60 * 60 * 1000;
let retryNum = 10;

// Schedule tasks to be run on the server.
cron.schedule('30 22 * * *', function() {
   // console.log(new Date());
    axiosReq();
});

// setInterval(axiosReq, intervalTime);//make sure the function runs once per day
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
            axios.get('https://demo.pygeoapi.io/covid-19/collections/cases/items?f=json&limit=10000')
                .then((response) => {
                    let d = new Date();
                    let y = new Date(d);
                    y.setDate(y.getDate() - 1)

                    //get yesterday's date
                    let yesterday = y.getFullYear() + '-' + ("0" + (y.getMonth() + 1)).slice(-2) + '-' + ("0" + y.getDate()).slice(-2);
                    let countcheck = "SELECT COUNT(LayerName) AS rowscount FROM dtrends.covid_19 WHERE Date = ?;"
                    con.query(countcheck, [yesterday], async function (err, count) {//check data length
                        let pointNum = parseFloat(count[0].rowscount);
                        let dif = response.data.features.length - pointNum;

                        //if the absolute value of difference larger than difLimit, it still has two condition
                        if (Math.abs(dif) > difLimit) {
                            if (pointNum == 0) {
                                //1st condition: start the process with an empty table
                                dataProcessing(response);
                            } else {
                                //2nd possible condition: big jump in OGC data source, then the process will send notification
                                console.log("Differences" + ":" + dif);
                                transport.sendMail(errMsg_DataLength, (error, info) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        console.log(`Message sent: ${info.response}`);
                                    }
                                });
                            }
                        } else {
                            //else: the absolute value of difference smaller than difLimit, run insert statement
                            dataProcessing(response);
                        }
                    });
                })
                .catch(error => {
                    console.log("download incomplete");
                    Timeout();
                });
        }
    })
}

function dataProcessing(download) {
    let countryN;

    for (let i = 0; i < download.data.features.length; i++) {
        // acquire data from OGC, make sure the data format is correct
        let stringx = [download.data.features[i].properties.Country_Region].toString();
        if (stringx.includes('(')) {
            countryN = stringx.substr(0, stringx.indexOf(' '));
        } else if (stringx.includes(',')) {
            countryN = stringx.substr(0, stringx.indexOf(','));
        } else if (stringx.includes('*')) {
            countryN = stringx.substr(0, stringx.indexOf('*'));
        } else {
            countryN = stringx;
        }

        // get the continent columns
        let continent = "SELECT Continent_name FROM dtrends.continent WHERE Country LIKE ?;"
        con.query(continent, "%" + countryN + "%", function (err, continents) {

            let Country_Region_Province_State, Province_State, Counrty_Region, Country_Region_Province_State_Combine,CountryRegion;
            if(download.data.features[i].properties.Country_Region !== null){
                Counrty_Region = download.data.features[i].properties.Country_Region.replace(/[^a-zA-Z0-9 ]/g, "");

            }//Get the country region that only has not null value

            if(download.data.features[i].properties.Province_State !== null){
                //if province state is not null, then delete all special character, and put underscore instead of space.
                Province_State = download.data.features[i].properties.Province_State.replace(/[^a-zA-Z0-9 ]/g, "");
                Country_Region_Province_State_Combine = Counrty_Region + "_" + Province_State;
                Country_Region_Province_State = Country_Region_Province_State_Combine.replace(/ /g, "_");
                Province_State = Province_State.replace(/ /g, "_");
            }else{
                //if province state = null, then null, and the combination will be only country region
                Country_Region_Province_State = Counrty_Region.replace(/ /g, "_");
                Province_State = null;
            }
            CountryRegion = Counrty_Region.replace(/ /g, "_");
            // console.log(Counrty_Region,"+",Province_State, "+",CountryRegion, i);

            let deleting = "DELETE FROM dtrends.covid_19 WHERE Date = ?;"
            let d = new Date(parseInt(download.data.features[i].properties.Last_Update));
            let date = d.getFullYear() + '-' + ("0" + (d.getMonth() + 1)).slice(-2) + '-' + ("0" + d.getDate()).slice(-2);
            let layername = 'coronav_' + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) + d.getFullYear() + '_' + Country_Region_Province_State;
            let sql = "INSERT INTO dtrends.covid_19(Date, LayerName, LayerType, FirstLayer, SecondLayer, DisplayName, CaseNum, DeathNum, RecovNum," +
                " ActiveNum, Latitude, Longitude,CityName, StateName, CountryName, ContinentName, Color_Confirmed, Color_Death, Color_Recovered) " +
                "VALUES (?,?,'H_PKLayer','Corona_Virus','',?,?,?,?,?,?,?,'',?,?,?,'rgb(220,0,0) rgb(220,0,0) rgb(220,0,0)','rgb(0,0,0) rgb(0,0,0) rgb(0,0,0)','rgb(124,252,0) rgb(124,252,0) rgb(124,252,0)'); ";

            // whole insert process
            con.query(sql, [date, layername, Country_Region_Province_State, download.data.features[i].properties.Confirmed,
                download.data.features[i].properties.Deaths, download.data.features[i].properties.Recovered,
                download.data.features[i].properties.Active, download.data.features[i].properties.Lat,
                download.data.features[i].properties.Long_, Province_State,
                CountryRegion, continents[0].Continent_name.replace(/ /g, "_")], function (err, result) {

                if (err) {
                    console.log(err);
                } else {
                    // console.log(i + "record inserted");
                    // delete the wrong coordinates rows, and send specific values notification
                    if (i == download.data.features.length - 1) {
                        let deleting_coordinate_email = "SELECT * FROM dtrends.covid_19 WHERE Latitude iS NULL OR Latitude = ?;"
                        let deleting_coordinate = "DELETE FROM dtrends.covid_19 WHERE Latitude iS NULL OR Latitude = ?;"

                        con.query(deleting_coordinate_email, 0, function (err, result) {
                            let rowsdeleted = JSON.stringify(result);
                            fs.writeFile("datadeleted.json", rowsdeleted, function (err) {
                                    if (err) throw err;
                                    console.log('complete');
                                }
                            );

                            transport.sendMail(dataErr, (error, info) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log(`Message sent: ${info.response}`);
                                }
                            });

                            if (!!result) {
                                con.query(deleting_coordinate, 0, function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    console.log("Deleted.");
                                });
                                con.query(deleting, "NaN-aN-aN", function (err, result) {
                                    //delete unavailable date data from table
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                        });
                    }
                }
            });

            if (err) {
                //send notification if the continents acquirement has problems
                console.log(err);
                transport.sendMail(errMsg_UndefinedCont, (error, info) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(`Message sent: ${info.response}`);
                    }
                });
            }
        });
    }
}

function Timeout() {
    setTimeout(function () {
        if (x < retryNum) {
            x += 1;
            axiosReq();
        } else {
            transport.sendMail(errMsg_Download, (error, info) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(`Message sent: ${info.response}`);
                }
            });
        }
    }, waitTime);
}